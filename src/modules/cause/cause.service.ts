import { Cause, DocStatus, DocType } from "../../../generated/prisma/client";
import type {
    ICauseRepository,
    ICauseService,
    CauseFilterParams,
    CauseWithRelations,
    CauseWithDonationCount,
    CauseDocument,
    CauseDocumentWithUrl,
    CauseCreateData,
    CauseUpdateData,
} from "./cause.types";
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

    private withImageUrls(cause: CauseWithRelations): CauseWithDonationCount {
        const { _count, ...rest } = cause;
        const causeWithDonationCount = {
            ...rest,
            donationsCount: _count?.donations ?? 0,
        };

        if (!causeWithDonationCount.images?.length) return causeWithDonationCount;

        return {
            ...causeWithDonationCount,
            images: causeWithDonationCount.images.map((img) => ({
                ...img,
                url: this.storage.presignRead(img.key),
            })),
        };
    }

    private withDocumentUrls(doc: CauseDocument): CauseDocumentWithUrl {
        return { ...doc, url: this.storage.presignRead(doc.fileKey) };
    }

    private async ensureAdmin(userId: string) {
        const user = await this.userRepository.findById(userId);
        if (!user?.isAdmin) {
            throw new ForbiddenError("Acesso restrito para administradores", ErrorCodes.FORBIDDEN);
        }
    }

    private async getCauseOrThrow(causeId: string) {
        const cause = await this.causeRepository.findById(causeId);
        if (!cause) {
            throw new NotFoundError("Causa não encontrada", ErrorCodes.CAUSE_NOT_FOUND);
        }
        return cause;
    }

    private ensureOwner(authorId: string, userId: string, message: string) {
        if (authorId !== userId) {
            throw new ForbiddenError(
                message,
                ErrorCodes.FORBIDDEN,
            );
        }
    }


    async create(data: CauseCreateData, authorId: string) {

        const category = await this.categoryRepository.findById(data.categoryId);

        if (!category) {
            throw new NotFoundError("Categoria não encontrada", ErrorCodes.CATEGORY_NOT_FOUND);
        }

        const { imageKeys = [], isFeatured = false, ...causeData } = data;

        const status = isFeatured ? "PENDING" : "ACTIVE";

        const cause = await this.causeRepository.create(
            {
                ...causeData,
                authorId,
                isFeatured,
                status,
                isVerified: false,
            },
            imageKeys,
        );

        if (isFeatured) {
            const author = await this.userRepository.findById(authorId);
            if (author?.email) {
                await this.emailQueueService.enqueueCauseUnderReview(author.email, {
                    userName: author.name,
                    causeTitle: cause.title,
                });
            }
        }

        return this.withImageUrls(cause);
    }

    async getCauseById(id: string) {
        const cause = await this.causeRepository.findById(id);
        if (!cause) return null;
        return this.withImageUrls(cause);
    }

    async getActiveCauses(filters: CauseFilterParams = {}) {
        const causes = await this.causeRepository.findActiveCauses(filters);
        return causes.map((c) => this.withImageUrls(c));
    }

    async getPendingCauses(adminId: string) {
        await this.ensureAdmin(adminId);
        const causes = await this.causeRepository.findPendingCauses();
        return causes.map((c) => this.withImageUrls(c));
    }

    async updateCause(id: string, data: CauseUpdateData, userId: string) {
        const cause = await this.getCauseOrThrow(id);
        this.ensureOwner(cause.authorId, userId, "Você não tem permissão para atualizar esta causa");

        if (cause.status === "INACTIVE") {
            const hasOtherUpdates = Object.keys(data).some(
                key => key !== "status" && data[key as keyof CauseUpdateData] !== undefined
            );

            if (hasOtherUpdates) {
                throw new ForbiddenError(
                    "Não é possível alterar os dados de uma campanha desativada. Reative-a primeiro.",
                    ErrorCodes.FORBIDDEN
                );
            }
        }

        if (data.categoryId) {
            const category = await this.categoryRepository.findById(data.categoryId);
            if (!category) {
                throw new NotFoundError("Categoria não encontrada", ErrorCodes.CATEGORY_NOT_FOUND);
            }
        }

        // Se não há imagens sendo enviadas, passe undefined para o repository
        let imageKeys: string[] | undefined = undefined;

        // Apenas processa imagens se há images ou imageKeys no request
        if (data.images || data.imageKeys) {
            const currentImageKeys = cause.images.map((image) => image.key);
            const reorderedExistingKeys = data.imageKeys ?? currentImageKeys;
            const hasInvalidKey = reorderedExistingKeys.some(
                (key) => !currentImageKeys.includes(key)
            );

            if (hasInvalidKey) {
                throw new ForbiddenError(
                    "Uma ou mais imagens enviadas não pertencem a esta causa",
                    ErrorCodes.FORBIDDEN,
                );
            }

            const uploadedImageKeys =
                data.images && data.images.length > 0
                    ? await this.storage.uploadImages(data.images)
                    : [];

            imageKeys =
                reorderedExistingKeys.length > 0 || uploadedImageKeys.length > 0
                    ? [...reorderedExistingKeys, ...uploadedImageKeys]
                    : undefined;
        }

        const { imageKeys: _imageKeys, images: _images, ...causeData } = data;
        const causeDataToUpdate: any = { ...causeData };

        if (data.isFeatured === true) {
            causeDataToUpdate.status = "PENDING";
            causeDataToUpdate.isVerified = false;
        }

        const updated = await this.causeRepository.update(id, causeDataToUpdate, imageKeys);

        const shouldNotifyUnderReview = data.isFeatured === true && !cause.isFeatured;

        if (shouldNotifyUnderReview) {
            const author = await this.userRepository.findById(cause.authorId);
            if (author?.email) {
                await this.emailQueueService.enqueueCauseUnderReview(author.email, {
                    userName: author.name,
                    causeTitle: updated.title,
                });
            }
        }

        return this.withImageUrls(updated);
    }

    async deleteCause(id: string, userId: string): Promise<Cause> {
        const cause = await this.getCauseOrThrow(id);
        this.ensureOwner(cause.authorId, userId, "Você não tem permissão para deletar esta causa");

        return this.causeRepository.delete(id);
    }


    async attachDocument(
        causeId: string,
        userId: string,
        fileKey: string,
        fileName: string,
        docType: DocType,
    ) {
        const cause = await this.getCauseOrThrow(causeId);
        this.ensureOwner(cause.authorId, userId, "Você não tem permissão para anexar documentos nesta causa");

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
        const cause = await this.getCauseOrThrow(causeId);

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
        await this.ensureAdmin(adminId);

        const doc = await this.causeRepository.updateDocumentStatus(docId, status, rejectionReason);
        return this.withDocumentUrls(doc);
    }

    async moderateCause(
        causeId: string,
        status: string,
        isVerified: boolean,
        adminId: string,
    ) {
        await this.ensureAdmin(adminId);

        const cause = await this.causeRepository.updateCauseVerification(causeId, status, isVerified);

        if (status === "ACTIVE" || status === "APPROVED") {
            const author = await this.userRepository.findById(cause.authorId);
            if (author?.email) {
                await this.emailQueueService.enqueueCauseApproval(author.email, {
                    userName: author.name,
                    causeTitle: cause.title,
                });
            }
        }

        return cause;
    }
}
