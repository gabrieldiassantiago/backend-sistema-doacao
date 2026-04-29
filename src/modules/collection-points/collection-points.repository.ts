import { PrismaClient, Prisma } from '../../../generated/prisma/client';
import type {
  ICollectionPointRepository,
  CreateCollectionPointData,
  UpdateCollectionPointData,
  CollectionPointWithItems,
  CollectionPointFilterParams,
} from './colleciton-points.types';
import type { CollectionPoint } from '../../../generated/prisma/client';

const INCLUDE_ITEMS = { acceptedItems: true } satisfies Prisma.CollectionPointInclude;

export class CollectionPointRepository implements ICollectionPointRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
      include: INCLUDE_ITEMS,
    });
  }

  async findById(id: string): Promise<CollectionPointWithItems | null> {
    return this.prisma.collectionPoint.findUnique({
      where: { id },
      include: INCLUDE_ITEMS,
    });
  }

  async findAll(skip = 0, take = 20): Promise<CollectionPointWithItems[]> {
    return this.prisma.collectionPoint.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_ITEMS,
    });
  }

  
   // Lista pontos ativos com suporte a filtros, busca e proximidade

  async findActive(filters: CollectionPointFilterParams = {}): Promise<CollectionPointWithItems[]> {
    const { skip = 0, take = 20, sort, city, state, lat, lng, radius = 50, search } = filters;

    if (sort === 'nearest' && lat !== undefined && lng !== undefined) {
      return this.findNearest({ lat, lng, radius, skip, take, city, state, search });
    }

    const where: Prisma.CollectionPointWhereInput = {
      isActive: true,
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(state && { state: { contains: state, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { neighborhood: { contains: search, mode: 'insensitive' } },
          { acceptedItems: { some: { name: { contains: search, mode: 'insensitive' } } } },
        ],
      }),
    };

    return this.prisma.collectionPoint.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_ITEMS,
    });
  }

  /**
   * Busca pontos de coleta ordenados por distância via Haversine (CTE).
   */

  private async findNearest(params: {
    lat: number;
    lng: number;
    radius: number;
    skip: number;
    take: number;
    city?: string;
    state?: string;
    search?: string;
  }): Promise<CollectionPointWithItems[]> {
    const { lat, lng, radius, skip, take, city, state, search } = params;

    type RawRow = { id: string; distance_km: number };

    const raw = await this.prisma.$queryRaw<RawRow[]>`
      WITH ranked AS (
        SELECT
          cp.id,
          (
            6371 * acos(
              LEAST(1.0,
                cos(radians(${lat}::double precision)) *
                cos(radians(cp.latitude)) *
                cos(radians(cp.longitude) - radians(${lng}::double precision)) +
                sin(radians(${lat}::double precision)) *
                sin(radians(cp.latitude))
              )
            )
          ) AS distance_km
        FROM "collection_point" cp
        WHERE
          cp."isActive" = true
          AND cp.latitude  IS NOT NULL
          AND cp.longitude IS NOT NULL
          ${city ? Prisma.sql`AND lower(cp.city) LIKE lower(${`%${city}%`})` : Prisma.empty}
          ${state ? Prisma.sql`AND lower(cp.state) LIKE lower(${`%${state}%`})` : Prisma.empty}
          ${
            search
              ? Prisma.sql`AND (
                  lower(cp.name) LIKE lower(${`%${search}%`})
                  OR lower(cp.neighborhood) LIKE lower(${`%${search}%`})
                  OR EXISTS (
                    SELECT 1 FROM "accepted_item" ai
                    WHERE ai."collectionPointId" = cp.id
                      AND lower(ai.name) LIKE lower(${`%${search}%`})
                  )
                )`
              : Prisma.empty
          }
      )
      SELECT id, distance_km
      FROM ranked
      WHERE distance_km <= ${radius}
      ORDER BY distance_km ASC
      LIMIT ${take}
      OFFSET ${skip}
    `;

    if (raw.length === 0) return [];

    const orderedIds = raw.map((r) => r.id);
    const distanceMap = new Map(raw.map((r) => [r.id, r.distance_km]));

    const points = await this.prisma.collectionPoint.findMany({
      where: { id: { in: orderedIds } },
      include: INCLUDE_ITEMS,
    });

    points.sort(
      (a, b) => (distanceMap.get(a.id) ?? Infinity) - (distanceMap.get(b.id) ?? Infinity)
    );

    return points;
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
        include: INCLUDE_ITEMS,
      });
    });
  }

  async delete(id: string): Promise<CollectionPoint> {
    return this.prisma.collectionPoint.delete({ where: { id } });
  }
}
