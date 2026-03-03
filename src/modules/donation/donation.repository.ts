import { BadgeKey, Donation, PrismaClient } from "../../../generated/prisma/client";

export type DonationWithRelations = Donation & {
  cause: { id: string; title: string; imageUrl: string | null };
  user:  { id: string; name: string; image: string | null };
};

export type UserDonationStats = {
  donationCount:    number;
  totalDonated:     number;
  earnedBadgeKeys:  BadgeKey[];
};

export type LeaderboardEntry = {
  rank:          number;
  id:            string;
  name:          string;
  image:         string | null;
  xpPoints:      number;
  donationCount: number;
  totalDonated:  number;
};

export type CreateDonationData = {
  amount:   number;
  message?: string;
  userId:   string;
  causeId:  string;
};

export interface IDonationRepository {
  createWithGamification(
    data:          CreateDonationData,
    xpEarned:      number,
    newBadgeKeys:  BadgeKey[],
  ): Promise<DonationWithRelations>;

  findById(id: string): Promise<DonationWithRelations | null>;

  findByUser(
    userId: string,
    skip:   number,
    take:   number,
  ): Promise<DonationWithRelations[]>;

  findByCause(
    causeId: string,
    skip:    number,
    take:    number,
  ): Promise<DonationWithRelations[]>;

  getUserStats(userId: string): Promise<UserDonationStats>;

  getLeaderboard(take: number): Promise<LeaderboardEntry[]>;
}


const donationInclude = {
  cause: { select: { id: true, title: true, imageUrl: true } },
  user:  { select: { id: true, name: true, image: true } },
} as const;

export class DonationRepository implements IDonationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createWithGamification(
    data:         CreateDonationData,
    xpEarned:     number,
    newBadgeKeys: BadgeKey[],
  ): Promise<DonationWithRelations> {
    return this.prisma.$transaction(async (tx) => {

      const donation = await tx.donation.create({
        data: { ...data, xpEarned },
        include: donationInclude,
      });

      await tx.cause.update({
        where: { id: data.causeId },
        data:  { raised: { increment: data.amount } },
      });

      await tx.user.update({
        where: { id: data.userId },
        data:  { xpPoints: { increment: xpEarned } },
      });

      if (newBadgeKeys.length > 0) {
        await tx.userBadge.createMany({
          data:            newBadgeKeys.map((badgeKey) => ({ userId: data.userId, badgeKey })),
          skipDuplicates:  true,
        });
      }

      return donation as DonationWithRelations;
    });
  }

  async findById(id: string): Promise<DonationWithRelations | null> {
    return this.prisma.donation.findUnique({
      where:   { id },
      include: donationInclude,
    }) as Promise<DonationWithRelations | null>;
  }

  async findByUser(userId: string, skip = 0, take = 20): Promise<DonationWithRelations[]> {
    return this.prisma.donation.findMany({
      where:   { userId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: donationInclude,
    }) as Promise<DonationWithRelations[]>;
  }

  async findByCause(causeId: string, skip = 0, take = 20): Promise<DonationWithRelations[]> {
    return this.prisma.donation.findMany({
      where:   { causeId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: donationInclude,
    }) as Promise<DonationWithRelations[]>;
  }

  async getUserStats(userId: string): Promise<UserDonationStats> {
    const [aggregate, badges] = await this.prisma.$transaction([
      this.prisma.donation.aggregate({
        where: { userId },
        _count: { id: true },
        _sum:   { amount: true },
      }),
      this.prisma.userBadge.findMany({
        where:  { userId },
        select: { badgeKey: true },
      }),
    ]);

    return {
      donationCount:   aggregate._count.id,
      totalDonated:    aggregate._sum.amount ?? 0,
      earnedBadgeKeys: badges.map((b) => b.badgeKey),
    };
  }

  async getLeaderboard(take = 10): Promise<LeaderboardEntry[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { xpPoints: "desc" },
      take,
      select: {
        id:       true,
        name:     true,
        image:    true,
        xpPoints: true,
        _count:   { select: { donations: true } },
        donations: { select: { amount: true } },
      },
    });

    return users.map((u, idx) => ({
      rank:          idx + 1,
      id:            u.id,
      name:          u.name,
      image:         u.image,
      xpPoints:      u.xpPoints,
      donationCount: u._count.donations,
      totalDonated:  u.donations.reduce((sum, d) => sum + d.amount, 0),
    }));
  }
}
