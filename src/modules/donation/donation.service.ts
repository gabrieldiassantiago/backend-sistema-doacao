import type { ICauseRepository } from "../cause/cause.types";
import type { IUserRepository } from "../user/user.types";
import {
  BADGE_META,
  computeLevel,
  computeNewBadges,
  computeXpForDonation,
} from "./gamification.service";
import { BadRequestError, NotFoundError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";
import type {
  CreateDonationData,
  DonationResult,
  DonationWithRelations,
  IDonationRepository,
  IDonationService,
  LeaderboardEntry,
  PaymentInput,
} from "./donation.types";
import type { EmailQueueService } from "../../jobs/email-queue";
import { BadgeKey } from "../../../generated/prisma/enums";

export class DonationService implements IDonationService {
  constructor(
    private readonly donationRepository: IDonationRepository,
    private readonly causeRepository:    ICauseRepository,
    private readonly userRepository:     IUserRepository,
    private readonly emailQueueService:  EmailQueueService,
  ) {}

  async create(data: CreateDonationData): Promise<DonationResult> {
    // valida a causa e o usuário
    const cause = await this.causeRepository.findById(data.causeId);

    if (!cause) {
      throw new NotFoundError("Causa não encontrada", ErrorCodes.CAUSE_NOT_FOUND);
    }

    if (cause.status !== "ACTIVE") {
      throw new BadRequestError("Causa não está aceitando doações", ErrorCodes.CAUSE_NOT_ACTIVE);
    }
    

    // busca stats atuais do usuário para calcular XP e badges
    const stats = await this.donationRepository.getUserStats(data.userId);

    const donationCountAfter = stats.donationCount + 1;
    const totalDonatedAfter  = stats.totalDonated + data.amount;

    let xpEarned = 0;
    let newBadgeKeys: BadgeKey[] = [];
    
    if (!data.isAnonymous) {
      xpEarned = computeXpForDonation(data.amount, donationCountAfter);
      newBadgeKeys = computeNewBadges(donationCountAfter, totalDonatedAfter, stats.earnedBadgeKeys);
    }

    // persiste a doação, atualização da causa, XP do usuário e badges desbloqueados em uma transação
    const donation = await this.donationRepository.createWithGamification(
      data,
      xpEarned,
      newBadgeKeys,
    );

    // recarrega os dados do usuário para retornar o XP atualizado e nível atual
    const updatedUser = await this.userRepository.findById(data.userId);
    const currentXp   = updatedUser?.xpPoints ?? 0;

    const result: DonationResult = {
      donation,
      xpEarned,
      newBadges: newBadgeKeys.map((k) => BADGE_META[k]),
      currentXp,
      level: computeLevel(currentXp),
    };

    if (updatedUser?.email) {
      this.emailQueueService.enqueueDonationConfirmation(updatedUser.email, {
        userName:   updatedUser.name,
        causeTitle: cause.title,
        amount:     data.amount,
        xpEarned,
        newBadges:  result.newBadges,
        levelName:  result.level.name,
      }).catch((err: any) => console.error("[email] Erro ao enviar confirmação:", err));
    }

    return result;
  }

  // Chamado pelo PaymentService após webhook do MP confirmar pagamento aprovado
  async createFromPayment(payment: PaymentInput): Promise<DonationResult | null> {
    const stats = await this.donationRepository.getUserStats(payment.userId);

    const donationCountAfter = stats.donationCount + 1;
    const totalDonatedAfter  = stats.totalDonated + payment.amount;

    let xpEarned = 0;
    let newBadgeKeys: BadgeKey[] = [];
    
    if (!payment.isAnonymous) {
      xpEarned = computeXpForDonation(payment.amount, donationCountAfter);
      newBadgeKeys = computeNewBadges(donationCountAfter, totalDonatedAfter, stats.earnedBadgeKeys);
    }

    const donation = await this.donationRepository.createWithGamificationAndPayment(
      {
        amount:  payment.amount,
        message: payment.message ?? undefined,
        userId:  payment.userId,
        causeId: payment.causeId,
        isAnonymous: payment.isAnonymous,
      },
      xpEarned,
      newBadgeKeys,
      payment.id,
    );

    if (!donation) return null;

    const updatedUser = await this.userRepository.findById(payment.userId);
    const cause       = await this.causeRepository.findById(payment.causeId);
    const currentXp   = updatedUser?.xpPoints ?? 0;

    const result: DonationResult = {
      donation,
      xpEarned,
      newBadges: newBadgeKeys.map((k) => BADGE_META[k]),
      currentXp,
      level: computeLevel(currentXp),
    };

    if (updatedUser?.email && cause) {
      this.emailQueueService.enqueueDonationConfirmation(updatedUser.email, {
        userName:   updatedUser.name,
        causeTitle: cause.title,
        amount:     payment.amount,
        xpEarned,
        newBadges:  result.newBadges,
        levelName:  result.level.name,
      }).catch((err: any) => console.error("[email] Erro ao enviar confirmação:", err));
    }

    return result;
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
