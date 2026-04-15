import { PrismaClient } from '../../../generated/prisma/client';
import type {
  ICollectionPointRepository,
  CreateCollectionPointData,
  UpdateCollectionPointData,
  CollectionPointWithItems,
} from './colleciton-points.types';
import type { CollectionPoint } from '../../../generated/prisma/client';

export class CollectionPointRepository implements ICollectionPointRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async create(data: CreateCollectionPointData): Promise<CollectionPointWithItems> {
    const { acceptedItems, ...pointData } = data;

    return this.prisma.collectionPoint.create({
      data: {
        ...pointData,
        country: pointData.country ?? 'Brasil',
        acceptedItems: {
          create: acceptedItems.map((name) => ({ name })),
        },
      },
      include: { acceptedItems: true },
    });
  }

  async findById(id: string): Promise<CollectionPointWithItems | null> {
    return this.prisma.collectionPoint.findUnique({
      where: { id },
      include: { acceptedItems: true },
    });
  }

  async findAll(skip = 0, take = 20): Promise<CollectionPointWithItems[]> {
    return this.prisma.collectionPoint.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { acceptedItems: true },
    });
  }

  async findActive(skip = 0, take = 20): Promise<CollectionPointWithItems[]> {
    return this.prisma.collectionPoint.findMany({
      where: { isActive: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { acceptedItems: true },
    });
  }

  async update(id: string, data: UpdateCollectionPointData): Promise<CollectionPointWithItems> {
    const { acceptedItems, ...pointData } = data;

    return this.prisma.$transaction(async (tx) => {

      if (acceptedItems !== undefined) {
        await tx.acceptedItem.deleteMany({ where: { collectionPointId: id } });
      }

      return tx.collectionPoint.update({
        where: { id },
        data: {
          ...pointData,
          ...(acceptedItems !== undefined && {
            acceptedItems: {
              create: acceptedItems.map((name) => ({ name })),
            },
          }),
        },
        include: { acceptedItems: true },
      });
    });
  }

  async delete(id: string): Promise<CollectionPoint> {
    return this.prisma.collectionPoint.delete({ where: { id } });
  }
}
