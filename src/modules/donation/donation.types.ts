import type { BadgeKey } from "../../../generated/prisma/client";
import { BadgeMeta, LevelInfo } from "./gamification.service";

export type DonationWithRelations = {
  id:        string;
  amount:    number;
  message:   string | null;
  xpEarned:  number;
  userId:    string;
  causeId:   string;
  createdAt: Date;
  cause:     { id: string; title: string; imageUrl: string | null };
  user:      { id: string; name: string; image: string | null };
};

export type UserDonationStats = {
  donationCount:   number;
  totalDonated:    number;
  earnedBadgeKeys: BadgeKey[];
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

export type PaymentInput = {
  id:      string;
  amount:  number;
  message: string | null;
  userId:  string;
  causeId: string;
};

export type DonationResult = {
  donation:  DonationWithRelations;
  xpEarned:  number;
  newBadges: BadgeMeta[];
  currentXp: number;
  level:     LevelInfo;
};

export interface IDonationRepository {
  createWithGamification(
    data:         CreateDonationData,
    xpEarned:     number,
    newBadgeKeys: BadgeKey[],
  ): Promise<DonationWithRelations>;

  createWithGamificationAndPayment(
    data:         CreateDonationData,
    xpEarned:     number,
    newBadgeKeys: BadgeKey[],
    paymentId:    string,
  ): Promise<DonationWithRelations>;

  findById(id: string): Promise<DonationWithRelations | null>;
  findByUser(userId: string, skip: number, take: number): Promise<DonationWithRelations[]>;
  findByCause(causeId: string, skip: number, take: number): Promise<DonationWithRelations[]>;
  getUserStats(userId: string): Promise<UserDonationStats>;
  getLeaderboard(take: number): Promise<LeaderboardEntry[]>;
}

export interface IDonationService {
  create(data: CreateDonationData): Promise<DonationResult>;
  createFromPayment(payment: PaymentInput): Promise<DonationResult>;
  findById(id: string): Promise<DonationWithRelations | null>;
  findByUser(userId: string, skip: number, take: number): Promise<DonationWithRelations[]>;
  findByCause(causeId: string, skip: number, take: number): Promise<DonationWithRelations[]>;
  getLeaderboard(take: number): Promise<LeaderboardEntry[]>;
}
