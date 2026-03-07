import type { Cause, Prisma } from "../../../generated/prisma/client";

// --- Interface do Repository ---
export interface ICauseRepository {
  create(data: Prisma.CauseUncheckedCreateInput): Promise<Cause>;
  findById(id: string): Promise<Cause | null>;
  findActiveCauses(skip?: number, take?: number): Promise<Cause[]>;
  update(id: string, data: Prisma.CauseUpdateInput): Promise<Cause>;
  delete(id: string): Promise<Cause>;
}

// --- Interface do Service ---
export interface ICauseService {
  create(
    data: { title: string; description: string; goalAmount: number; imageUrl?: string; isFeatured?: boolean },
    authorId: string,
  ): Promise<Cause>;
  getCauseById(id: string): Promise<Cause | null>;
  getActiveCauses(skip?: number, take?: number): Promise<Cause[]>;
  updateCause(
    id: string,
    data: { title?: string; description?: string; goalAmount?: number; imageUrl?: string; isFeatured?: boolean },
    userId: string,
  ): Promise<Cause>;
  deleteCause(id: string, userId: string): Promise<Cause>;
}
