import { Cause, DocStatus, DocType } from "../../../generated/prisma/client";
import type { ICauseRepository, ICauseService, CauseFilterParams } from "./cause.types";
import { NotFoundError, ForbiddenError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";
import type { ICategoryRepository } from "../category/category.types";
import { IUserRepository } from "../user/user.types";
import { S3StorageService } from "../../lib/s3";
import { EmailQueueService } from "../../jobs/email-queue";


export class CauseService implements ICauseService {
    constructor(
        private readonly causeRepository: ICauseRepository,
        private readonly categoryRepository: ICategoryRepository,
        private readonly userRepository: IUserRepository,
        private readonly storage: S3StorageService,
        private readonly emailQueueService: EmailQueueService,
    ) { }

    private withImageUrls<T extends { images?: Array<{ key: string }> } | null>(
        cause: T,
    ): T {
        if (!cause || !cause.images?.length) return cause;
        return {
            ...cause,
            images: cause.images.map((img) => ({
                ...img,
                url: this.storage.presignRead(img.key),
            })),
        } as T;
    }

    private withDocumentUrls<T extends { fileKey: string }>(
        doc: T,
    ): T & { url: string } {
        return { ...doc, url: this.storage.presignRead(doc.fileKey) };
    }


    async create(
        data: {
            title: string;
            description: string;
            goalAmount: number;
            imageKeys?: string[];
            isFeatured?: boolean;
            categoryId: string;
            locationName?: string;
            address?: string;
            city?: string;
            state?: string;
            country?: string;
            latitude?: number;
            longitude?: number;
        },
        authorId: string,
    ) {
        const category = await this.categoryRepository.findById(data.categoryId);
        if (!category) {
            throw new NotFoundError("Categoria não encontrada", ErrorCodes.CATEGORY_NOT_FOUND);
        }

        const { imageKeys = [], ...causeData } = data;

        const cause = await this.causeRepository.create({ ...causeData, authorId }, imageKeys);
        return this.withImageUrls(cause);
    }

    async getCauseById(id: string) {
        const cause = await this.causeRepository.findById(id);
        return this.withImageUrls(cause);
    }

    async getActiveCauses(filters: CauseFilterParams = {}) {
        const causes = await this.causeRepository.findActiveCauses(filters);
        return causes.map((c) => this.withImageUrls(c));
    }

    async getPendingCauses(adminId: string) {
        const admin = await this.userRepository.findById(adminId);
        if (!admin?.isAdmin) {
            throw new ForbiddenError("Acesso restrito para administradores", ErrorCodes.FORBIDDEN);
        }
        const causes = await this.causeRepository.findPendingCauses();
        return causes.map((c) => this.withImageUrls(c));
    }

    async updateCause(
        id: string,
        data: {
            title?: string;
            description?: string;
            goalAmount?: number;
            imageKeys?: string[];
            isFeatured?: boolean;
            categoryId?: string;
            locationName?: string;
            address?: string;
            city?: string;
            state?: string;
            country?: string;
            latitude?: number;
            longitude?: number;
        },
        userId: string,
    ) {
        const cause = await this.causeRepository.findById(id);
        if (!cause) {
            throw new NotFoundError("Causa não encontrada", ErrorCodes.CAUSE_NOT_FOUND);
        }

        if (cause.authorId !== userId) {
            throw new ForbiddenError(
                "Você não tem permissão para atualizar esta causa",
                ErrorCodes.FORBIDDEN,
            );
        }

        if (data.categoryId) {
            const category = await this.categoryRepository.findById(data.categoryId);
            if (!category) {
                throw new NotFoundError("Categoria não encontrada", ErrorCodes.CATEGORY_NOT_FOUND);
            }
        }

        const { imageKeys, ...causeData } = data;

        const updated = await this.causeRepository.update(id, causeData, imageKeys);
        return this.withImageUrls(updated);
    }

    async deleteCause(id: string, userId: string): Promise<Cause> {
        const cause = await this.causeRepository.findById(id);
        if (!cause) {
            throw new NotFoundError("Causa não encontrada", ErrorCodes.CAUSE_NOT_FOUND);
        }

        if (cause.authorId !== userId) {
            throw new ForbiddenError(
                "Você não tem permissão para deletar esta causa",
                ErrorCodes.FORBIDDEN,
            );
        }

        return this.causeRepository.delete(id);
    }

    async getCausesByUser(userId: string) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError("Usuário não encontrado", ErrorCodes.USER_NOT_FOUND);
        }
    }


    async attachDocument(
        causeId: string,
        userId: string,
        fileKey: string,
        fileName: string,
        docType: DocType,
    ) {
        const cause = await this.causeRepository.findById(causeId);
        if (!cause) {
            throw new NotFoundError("Causa não encontrada", ErrorCodes.CAUSE_NOT_FOUND);
        }

        if (cause.authorId !== userId) {
            throw new ForbiddenError(
                "Você não tem permissão para anexar documentos nesta causa",
                ErrorCodes.FORBIDDEN,
            );
        }

        const doc = await this.causeRepository.addDocument({
            causeId,
            fileKey,
            fileName,
            docType,
            status: "PENDING",
        });

        return this.withDocumentUrls(doc);
    }

    async getDocuments(causeId: string, userId: string) {
        const cause = await this.causeRepository.findById(causeId);
        if (!cause) {
            throw new NotFoundError("Causa não encontrada", ErrorCodes.CAUSE_NOT_FOUND);
        }

        const user = await this.userRepository.findById(userId);
        if (cause.authorId !== userId && !user?.isAdmin) {
            throw new ForbiddenError(
                "Você não tem permissão para visualizar os documentos desta causa",
                ErrorCodes.FORBIDDEN,
            );
        }

        const docs = await this.causeRepository.getDocumentsByCause(causeId);
        return docs.map((d) => this.withDocumentUrls(d));
    }

    async reviewDocument(
        docId: string,
        status: DocStatus,
        adminId: string,
        rejectionReason?: string,
    ) {
        const admin = await this.userRepository.findById(adminId);
        if (!admin?.isAdmin) {
            throw new ForbiddenError("Acesso restrito para administradores", ErrorCodes.FORBIDDEN);
        }

        return this.causeRepository.updateDocumentStatus(docId, status, rejectionReason);
    }

    async moderateCause(
        causeId: string,
        status: string,
        isVerified: boolean,
        adminId: string,
    ) {
        const admin = await this.userRepository.findById(adminId);
        if (!admin?.isAdmin) {
            throw new ForbiddenError("Acesso restrito para administradores", ErrorCodes.FORBIDDEN);
        }

        const cause = await this.causeRepository.updateCauseVerification(causeId, status, isVerified);

        if (status === "ACTIVE" || status === "APPROVED") {
            const author = await this.userRepository.findById(cause.authorId);
            if (author?.email) {
                await this.emailQueueService.enqueueCauseApproval(author.email, cause.title);
            }
        }

        return cause;
    }
}