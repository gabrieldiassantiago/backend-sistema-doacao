import { Cause } from "../../../generated/prisma/client";
import type { ICauseRepository, ICauseService } from "./cause.types";
import { NotFoundError, ForbiddenError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";

export class CauseService implements ICauseService {
    constructor(private readonly causeRepository: ICauseRepository) {}

    async create(data: { title: string; description: string; goalAmount: number; imageUrls: string[]; isFeatured?: boolean }, authorId: string): Promise<Cause> {
        return this.causeRepository.create({ ...data, authorId });
    }

    async getCauseById(id: string): Promise<Cause | null> {
        return this.causeRepository.findById(id);
    }

    async getActiveCauses(skip = 0, take = 20): Promise<Cause[]> {
        return this.causeRepository.findActiveCauses(skip, take);
    }

    async updateCause(id: string, data: { title?: string; description?: string; goalAmount?: number; imageUrls?: string[]; isFeatured?: boolean }, userId: string): Promise<Cause> {
        const cause = await this.causeRepository.findById(id);
        if (!cause) throw new NotFoundError("Causa não encontrada", ErrorCodes.CAUSE_NOT_FOUND);
        if (cause.authorId !== userId) throw new ForbiddenError("Você não tem permissão para atualizar esta causa", ErrorCodes.FORBIDDEN);
        return this.causeRepository.update(id, data);
    }

    async deleteCause(id: string, userId: string): Promise<Cause> {
        const cause = await this.causeRepository.findById(id);
        if (!cause) throw new NotFoundError("Causa não encontrada", ErrorCodes.CAUSE_NOT_FOUND);
        if (cause.authorId !== userId) throw new ForbiddenError("Você não tem permissão para deletar esta causa", ErrorCodes.FORBIDDEN);
        return this.causeRepository.delete(id);
    }

}