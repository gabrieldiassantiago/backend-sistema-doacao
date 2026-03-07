import { Cause } from "../../../generated/prisma/browser";
import { Prisma, PrismaClient } from "../../../generated/prisma/client";
import type { ICauseRepository } from "./cause.types";

export class CauseRepository implements ICauseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Prisma.CauseUncheckedCreateInput): Promise<Cause> {
    return this.prisma.cause.create({
      data,
    });
  }

  async findById(id: string): Promise<Cause | null> {
    return this.prisma.cause.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        _count: {
          select: { donations: true } 
        }
      },
    });
  }

  async findActiveCauses(skip: number = 0, take: number = 20): Promise<Cause[]> {
    return this.prisma.cause.findMany({
      where: { status: 'ACTIVE' },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.CauseUpdateInput): Promise<Cause> {
    return this.prisma.cause.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Cause> {
    return this.prisma.cause.delete({
      where: { id },
    });
  }
}
