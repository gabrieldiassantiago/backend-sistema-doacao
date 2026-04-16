import { PrismaClient, Prisma, Cause } from "../../../generated/prisma/client";
import type { ICauseRepository, CauseWithRelations } from "./cause.types";

export class CauseRepository implements ICauseRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async create(
    data: Prisma.CauseUncheckedCreateInput,
    imageKeys: string[] = []
  ): Promise<CauseWithRelations> {
    return this.prisma.cause.create({
      data: {
        ...data,
        images: {
          create: imageKeys.map((key, index) => ({
            key,
            position: index,
          })),
        },
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        category: {
          select: { id: true, name: true, description: true },
        },
        images: {
          orderBy: { position: "asc" },
        },
        _count: {
          select: { donations: true },
        },
      },
    });
  }

  async findById(id: string): Promise<CauseWithRelations | null> {
    return this.prisma.cause.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        category: {
          select: { id: true, name: true, description: true },
        },
        images: {
          orderBy: { position: "asc" },
        },
        _count: {
          select: { donations: true },
        },
      },
    });
  }

  async findActiveCauses(skip = 0, take = 20): Promise<CauseWithRelations[]> {
    return this.prisma.cause.findMany({
      where: { status: "ACTIVE" },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { id: true, name: true, description: true },
        },
        author: {
          select: { id: true, name: true, image: true },
        },
        images: {
          orderBy: { position: "asc" },
        },
        _count: {
          select: { donations: true },
        },
        //contar quantas doações foram feitas para a causa]


      },
    });
  }

  async update(
    id: string,
    data: Prisma.CauseUpdateInput,
    imageKeys?: string[]
  ): Promise<CauseWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      if (imageKeys) {
        await tx.causeImage.deleteMany({
          where: { causeId: id },
        });
      }

      await tx.cause.update({
        where: { id },
        data,
      });

      if (imageKeys) {
        await tx.causeImage.createMany({
          data: imageKeys.map((key, index) => ({
            causeId: id,
            key,
            position: index,
          })),
        });
      }

      return tx.cause.findUniqueOrThrow({
        where: { id },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          category: {
            select: { id: true, name: true, description: true },
          },
          images: {
            orderBy: { position: "asc" },
          },
          _count: {
            select: { donations: true },
          },
        },
      });
    });
  }

  async delete(id: string): Promise<Cause> {
    return this.prisma.cause.delete({
      where: { id },
    });
  }
}