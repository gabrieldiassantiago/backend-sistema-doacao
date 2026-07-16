import { PrismaClient, Prisma, Cause, DocStatus } from "../../../generated/prisma/client";
import type { ICauseRepository, CauseWithRelations, CauseFilterParams } from "./cause.types";

const CAUSE_INCLUDE = {
  author: {
    select: { id: true, name: true, image: true },
  },
  category: {
    select: { id: true, name: true, description: true },
  },
  images: {
    orderBy: { position: "asc" as const },
  },
  documents: true,
  _count: {
    select: { donations: true },
  },
} satisfies Prisma.CauseInclude;

export class CauseRepository implements ICauseRepository {

  private static PAGE_SIZE = 12; //limita resultados por pagina

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
      include: CAUSE_INCLUDE,
    });
  }

  async findById(id: string): Promise<CauseWithRelations | null> {
    return this.prisma.cause.findUnique({
      where: { id },
      include: CAUSE_INCLUDE,
    });
  }

  async findActiveCauses(filters: CauseFilterParams = {}): Promise<CauseWithRelations[]> {
    const { skip = 0, take = CauseRepository.PAGE_SIZE, sort, city, state, lat, lng, radius = 50, categoryId, search } =
      filters;

    const limitedTake = Math.min(take || CauseRepository.PAGE_SIZE, CauseRepository.PAGE_SIZE);

    if (sort === "nearest" && lat !== undefined && lng !== undefined) {
      return this.findNearestCauses({ lat, lng, radius, skip, take: limitedTake, city, state, categoryId, search });
    }

    const where: Prisma.CauseWhereInput = {
      status: "ACTIVE",
      ...(city && { city: { contains: city, mode: "insensitive" } }),
      ...(state && { state: { contains: state, mode: "insensitive" } }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    let orderBy: Prisma.CauseOrderByWithRelationInput | Prisma.CauseOrderByWithRelationInput[];

    if (sort === "most_popular") {
      orderBy = { donations: { _count: "desc" } };
    } else if (sort === "most_urgent") {
      orderBy = [{ raised: "asc" }, { goalAmount: "desc" }];
    } else {
      orderBy = { createdAt: "desc" };
    }

    return this.prisma.cause.findMany({
      where,
      skip,
      take: limitedTake,
      orderBy,
      include: CAUSE_INCLUDE,
    });
  }

  async findPendingCauses(): Promise<CauseWithRelations[]> {
    return this.prisma.cause.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: CAUSE_INCLUDE,
    });
  }

  private async findNearestCauses(params: {
    lat: number;
    lng: number;
    radius: number;
    skip: number;
    take: number;
    city?: string;
    state?: string;
    categoryId?: string;
    search?: string;
  }): Promise<CauseWithRelations[]> {
    const { lat, lng, radius, skip, city, state, categoryId, search } = params;
    const limitedTake = Math.min(params.take, CauseRepository.PAGE_SIZE);

    type RawRow = { id: string; distance_km: number };

    const raw = await this.prisma.$queryRaw<RawRow[]>`
      WITH ranked AS (
        SELECT
          c.id,
          (
            6371 * acos(
              LEAST(1.0,
                cos(radians(${lat}::double precision)) *
                cos(radians(c.latitude)) *
                cos(radians(c.longitude) - radians(${lng}::double precision)) +
                sin(radians(${lat}::double precision)) *
                sin(radians(c.latitude))
              )
            )
          ) AS distance_km
        FROM "Cause" c
        WHERE
          c.status = 'ACTIVE'
          AND c.latitude  IS NOT NULL
          AND c.longitude IS NOT NULL
          ${city ? Prisma.sql`AND lower(c.city) LIKE lower(${`%${city}%`})` : Prisma.empty}
          ${state ? Prisma.sql`AND lower(c.state) LIKE lower(${`%${state}%`})` : Prisma.empty}
          ${categoryId ? Prisma.sql`AND c."categoryId" = ${categoryId}` : Prisma.empty}
          ${search
        ? Prisma.sql`AND (lower(c.title) LIKE lower(${`%${search}%`}) OR lower(c.description) LIKE lower(${`%${search}%`}))`
        : Prisma.empty
      }
      )
      SELECT id, distance_km
      FROM ranked
      WHERE distance_km <= ${radius}
      ORDER BY distance_km ASC
      LIMIT ${limitedTake}
      OFFSET ${skip}
    `;

    if (raw.length === 0) return [];

    const orderedIds = raw.map((r) => r.id);
    const distanceMap = new Map(raw.map((r) => [r.id, r.distance_km]));


    const causes = await this.prisma.cause.findMany({
      where: { id: { in: orderedIds } },
      include: CAUSE_INCLUDE,
    });

    causes.sort(
      (a, b) => (distanceMap.get(a.id) ?? Infinity) - (distanceMap.get(b.id) ?? Infinity)
    );

    return causes;
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
        include: CAUSE_INCLUDE,
      });
    });
  }

  async delete(id: string): Promise<Cause> {
    return this.prisma.cause.delete({
      where: { id },
    });
  }

  async addDocument(data: Prisma.CauseDocumentUncheckedCreateInput) {
    return this.prisma.causeDocument.create({ data });
  }

  async getDocumentsByCause(causeId: string) {
    return this.prisma.causeDocument.findMany({
      where: { causeId }
    });
  }

  async updateDocumentStatus(id: string, status: DocStatus, rejectionReason?: string) {
    return this.prisma.causeDocument.update({
      where: { id },
      data: { status, rejectionReason }
    });
  }

  async updateCauseVerification(id: string, status: string, isVerified: boolean) {
    return this.prisma.cause.update({
      where: { id },
      data: { status, isVerified }
    });
  }
}