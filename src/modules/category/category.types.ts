import type { Category, Prisma } from "../../../generated/prisma/client";

export interface ICategoryRepository {
  create(data: Prisma.CategoryUncheckedCreateInput): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findMany(skip?: number, take?: number): Promise<Category[]>;
  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category>;
  delete(id: string): Promise<Category>;
  countCauses(id: string): Promise<number>;
}

export interface ICategoryService {
  create(data: { name: string; description?: string }): Promise<Category>;
  getById(id: string): Promise<Category | null>;
  getAll(skip?: number, take?: number): Promise<Category[]>;
  update(id: string, data: { name?: string; description?: string }): Promise<Category>;
  delete(id: string): Promise<Category>;
}
