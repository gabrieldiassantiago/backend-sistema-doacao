import { PrismaClient, Prisma, SuggestionStatus } from '../../../../generated/prisma/client';
import type {
  ISuggestionRepository,
  CreateSuggestionData,
  SuggestionWithImagesAndUser,
} from './suggestion.types';

const INCLUDE_IMAGES_AND_USER = {
  images: { orderBy: { position: 'asc' as const } },
  user: { select: { id: true, name: true, email: true, image: true } },
} satisfies Prisma.CollectionPointSuggestionInclude;

export class SuggestionRepository implements ISuggestionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: CreateSuggestionData,
    userId: string,
    imageKeys: string[],
  ): Promise<SuggestionWithImagesAndUser> {
    const { suggestedItems, ...pointData } = data;

    return this.prisma.collectionPointSuggestion.create({
      data: {
        ...pointData,
        country: pointData.country ?? 'Brasil',
        suggestedItems,
        userId,
        images: {
          create: imageKeys.map((key, index) => ({ key, position: index })),
        },
      },
      include: INCLUDE_IMAGES_AND_USER,
    });
  }

  async findById(id: string): Promise<SuggestionWithImagesAndUser | null> {
    return this.prisma.collectionPointSuggestion.findUnique({
      where: { id },
      include: INCLUDE_IMAGES_AND_USER,
    });
  }

  async findByUserId(
    userId: string,
    skip = 0,
    take = 20,
  ): Promise<SuggestionWithImagesAndUser[]> {
    return this.prisma.collectionPointSuggestion.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_IMAGES_AND_USER,
    });
  }

  async findByStatus(
    status: SuggestionStatus,
    skip = 0,
    take = 20,
  ): Promise<SuggestionWithImagesAndUser[]> {
    return this.prisma.collectionPointSuggestion.findMany({
      where: { status },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_IMAGES_AND_USER,
    });
  }

  async countByStatus(status: SuggestionStatus): Promise<number> {
    return this.prisma.collectionPointSuggestion.count({
      where: { status },
    });
  }

  async updateStatus(
    id: string,
    status: SuggestionStatus,
    adminNote?: string,
    approvedPointId?: string,
  ): Promise<SuggestionWithImagesAndUser> {
    return this.prisma.collectionPointSuggestion.update({
      where: { id },
      data: {
        status,
        adminNote,
        approvedPointId,
        reviewedAt: new Date(),
      },
      include: INCLUDE_IMAGES_AND_USER,
    });
  }
}
