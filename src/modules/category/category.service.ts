import { Category } from "../../../generated/prisma/client";
import { ConflictError, NotFoundError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";
import type { ICategoryRepository, ICategoryService } from "./category.types";

export class CategoryService implements ICategoryService {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async create(data: { name: string; description?: string }): Promise<Category> {
    const name = data.name.trim();
    const existing = await this.categoryRepository.findByName(name);
    if (existing) {
      throw new ConflictError("Categoria já existe", ErrorCodes.ALREADY_EXISTS);
    }

    return this.categoryRepository.create({
      name,
      description: data.description?.trim() || null,
    });
  }

  async getById(id: string): Promise<Category | null> {
    return this.categoryRepository.findById(id);
  }

  async getAll(skip = 0, take = 20): Promise<Category[]> {
    return this.categoryRepository.findMany(skip, take);
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Categoria não encontrada", ErrorCodes.CATEGORY_NOT_FOUND);
    }

    if (data.name) {
      const nextName = data.name.trim();
      const duplicate = await this.categoryRepository.findByName(nextName);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError("Categoria já existe", ErrorCodes.ALREADY_EXISTS);
      }
    }

    return this.categoryRepository.update(id, {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
    });
  }

  async delete(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Categoria não encontrada", ErrorCodes.CATEGORY_NOT_FOUND);
    }

    const causesCount = await this.categoryRepository.countCauses(id);
    if (causesCount > 0) {
      throw new ConflictError("Categoria possui causas vinculadas", ErrorCodes.CATEGORY_IN_USE);
    }

    return this.categoryRepository.delete(id);
  }
}
