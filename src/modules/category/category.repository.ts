import { Category, Prisma, PrismaClient } from "../../../generated/prisma/client";
import type { ICategoryRepository } from "./category.types";

export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Prisma.CategoryUncheckedCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  async findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { name } });
  }

  async findMany(skip: number = 0, take: number = 20): Promise<Category[]> {
    return this.prisma.category.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { causes: true },
        },
      },
    }) as Promise<Category[]>;
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Category> {
    return this.prisma.category.delete({ where: { id } });
  }

  async countCauses(id: string): Promise<number> {
    return this.prisma.cause.count({ where: { categoryId: id } });
  }
}
