import { Cause } from "../../../generated/prisma/client";
import type { ICauseRepository, ICauseService } from "./cause.types";
import type { CreateCauseSchema, UpdateCauseDTO } from "./cause.schema";

export class CauseService implements ICauseService {
    constructor(private readonly causeRepository: ICauseRepository) {}

    async create(data: CreateCauseSchema, authorId: string): Promise<Cause> {
        return this.causeRepository.create({ ...data, authorId });
    }

    async getCauseById(id: string): Promise<Cause | null> {
        return this.causeRepository.findById(id);
    }

    async getActiveCauses(skip = 0, take = 20): Promise<Cause[]> {
        return this.causeRepository.findActiveCauses(skip, take);
    }

    async updateCause(id: string, data: UpdateCauseDTO, userId: string): Promise<Cause> {
        const cause = await this.causeRepository.findById(id);
        if (!cause) throw new Error("Cause not found");
        if (cause.authorId !== userId) throw new Error("Unauthorized");
        return this.causeRepository.update(id, data);
    }

    async deleteCause(id: string, userId: string): Promise<Cause> {
        const cause = await this.causeRepository.findById(id);
        if (!cause) throw new Error("Cause not found");
        if (cause.authorId !== userId) throw new Error("Unauthorized");
        return this.causeRepository.delete(id);
    }

}