import type { Cause, Prisma } from "../../../generated/prisma/client";

export type CauseWithRelations = Prisma.CauseGetPayload<{
  include: {
    author: {
      select: { id: true; name: true; image: true };
    };
    category: {
      select: { id: true; name: true; description: true };
    };
    images: {
      orderBy: { position: "asc" };
    };
    _count: {
      select: { donations: true };
    };
  };
}>;

type LocationData = {
  locationName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

export interface ICauseRepository {
  create(
    data: Prisma.CauseUncheckedCreateInput,
    imageKeys?: string[]
  ): Promise<CauseWithRelations>;

  findById(id: string): Promise<CauseWithRelations | null>;
  findActiveCauses(skip?: number, take?: number): Promise<CauseWithRelations[]>;

  update(
    id: string,
    data: Prisma.CauseUpdateInput,
    imageKeys?: string[]
  ): Promise<CauseWithRelations>;

  delete(id: string): Promise<Cause>;
}

export interface ICauseService {
  create(
    data: {
      title: string;
      description: string;
      goalAmount: number;
      isFeatured?: boolean;
      categoryId: string;
      imageKeys?: string[];
    } & LocationData,
    authorId: string
  ): Promise<CauseWithRelations>;

  getCauseById(id: string): Promise<CauseWithRelations | null>;
  getActiveCauses(skip?: number, take?: number): Promise<CauseWithRelations[]>;

  updateCause(
    id: string,
    data: {
      title?: string;
      description?: string;
      goalAmount?: number;
      isFeatured?: boolean;
      categoryId?: string;
      imageKeys?: string[];
    } & LocationData,
    userId: string
  ): Promise<CauseWithRelations>;

  deleteCause(id: string, userId: string): Promise<Cause>;
}