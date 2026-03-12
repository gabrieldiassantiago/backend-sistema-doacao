import type { ICauseRepository } from "../cause/cause.types";
import type { IUserRepository } from "../user/user.types";
import { sendDonationConfirmationEmail } from "../../lib/mailer";
import {
  BADGE_META,
  computeLevel,
  computeNewBadges,
  computeXpForDonation,
} from "./gamification.service";
import type {
  CreateDonationData,
  DonationResult,
  DonationWithRelations,
  IDonationRepository,
  IDonationService,
  LeaderboardEntry,
  PaymentInput,
} from "./donation.types";

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

    const result: DonationResult = {
      donation,
      xpEarned,
      newBadges: newBadgeKeys.map((k) => BADGE_META[k]),
      currentXp,
      level: computeLevel(currentXp),
    };

    if (updatedUser?.email) {
      sendDonationConfirmationEmail(updatedUser.email, {
        userName:   updatedUser.name,
        causeTitle: cause.title,
        amount:     data.amount,
        xpEarned,
        newBadges:  result.newBadges,
        levelName:  result.level.name,
      }).catch((err) => console.error("[email] Erro ao enviar confirmação:", err));
    }

    return result;
  }

  // Chamado pelo PaymentService após webhook do MP confirmar pagamento aprovado
  async createFromPayment(payment: PaymentInput): Promise<DonationResult> {
    const stats = await this.donationRepository.getUserStats(payment.userId);

    const donationCountAfter = stats.donationCount + 1;
    const totalDonatedAfter  = stats.totalDonated + payment.amount;

    const xpEarned     = computeXpForDonation(payment.amount, donationCountAfter);
    const newBadgeKeys = computeNewBadges(donationCountAfter, totalDonatedAfter, stats.earnedBadgeKeys);

    const donation = await this.donationRepository.createWithGamificationAndPayment(
      {
        amount:  payment.amount,
        message: payment.message ?? undefined,
        userId:  payment.userId,
        causeId: payment.causeId,
      },
      xpEarned,
      newBadgeKeys,
      payment.id,
    );

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
      sendDonationConfirmationEmail(updatedUser.email, {
        userName:   updatedUser.name,
        causeTitle: cause.title,
        amount:     payment.amount,
        xpEarned,
        newBadges:  result.newBadges,
        levelName:  result.level.name,
      }).catch((err) => console.error("[email] Erro ao enviar confirmação:", err));
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
