import { ICauseRepository } from "../cause/cause.repository";
import { IUserRepository } from "../user/user.repository";
import {
  BADGE_META,
  BadgeMeta,
  LevelInfo,
  computeLevel,
  computeNewBadges,
  computeXpForDonation,
} from "./gamification.service";
import {
  CreateDonationData,
  DonationWithRelations,
  IDonationRepository,
  LeaderboardEntry,
} from "./donation.repository";


export type DonationResult = {
  donation:   DonationWithRelations;
  xpEarned:   number;
  newBadges:  BadgeMeta[];
  currentXp:  number;
  level:      LevelInfo;
};

export interface IDonationService {
  create(data: CreateDonationData): Promise<DonationResult>;
  findById(id: string): Promise<DonationWithRelations | null>;
  findByUser(userId: string, skip: number, take: number): Promise<DonationWithRelations[]>;
  findByCause(causeId: string, skip: number, take: number): Promise<DonationWithRelations[]>;
  getLeaderboard(take: number): Promise<LeaderboardEntry[]>;
}

export class DonationService implements IDonationService {
  constructor(
    private readonly donationRepository: IDonationRepository,
    private readonly causeRepository:    ICauseRepository,
    private readonly userRepository:     IUserRepository,
  ) {}

  async create(data: CreateDonationData): Promise<DonationResult> {
    // valida a causa e o usuário
    const cause = await this.causeRepository.findById(data.causeId);
    if (!cause) throw new Error("Cause not found");
    if (cause.status !== "ACTIVE") throw new Error("Cause is not accepting donations");

    // busca stats atuais do usuário para calcular XP e badges
    const stats = await this.donationRepository.getUserStats(data.userId);

    const donationCountAfter = stats.donationCount + 1;
    const totalDonatedAfter  = stats.totalDonated + data.amount;

    // calcula o XP ganho e os badges desbloqueados com essa doação
    const xpEarned    = computeXpForDonation(data.amount, donationCountAfter);
    const newBadgeKeys = computeNewBadges(donationCountAfter, totalDonatedAfter, stats.earnedBadgeKeys);

    // persiste a doação, atualização da causa, XP do usuário e badges desbloqueados em uma transação
    const donation = await this.donationRepository.createWithGamification(
      data,
      xpEarned,
      newBadgeKeys,
    );

    // recarrega os dados do usuário para retornar o XP atualizado e nível atual
    const updatedUser = await this.userRepository.findById(data.userId);
    const currentXp   = updatedUser?.xpPoints ?? 0;

    return {
      donation,
      xpEarned,
      newBadges: newBadgeKeys.map((k) => BADGE_META[k]),
      currentXp,
      level: computeLevel(currentXp),
    };
  }

  async findById(id: string): Promise<DonationWithRelations | null> {
    return this.donationRepository.findById(id);
  }

  async findByUser(userId: string, skip = 0, take = 20): Promise<DonationWithRelations[]> {
    return this.donationRepository.findByUser(userId, skip, take);
  }

  async findByCause(causeId: string, skip = 0, take = 20): Promise<DonationWithRelations[]> {
    return this.donationRepository.findByCause(causeId, skip, take);
  }

  async getLeaderboard(take = 10): Promise<LeaderboardEntry[]> {
    return this.donationRepository.getLeaderboard(take);
  }
}
