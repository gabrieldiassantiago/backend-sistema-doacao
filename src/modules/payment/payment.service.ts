import { PrismaClient } from "../../../generated/prisma/client";
import { ICauseRepository } from "../cause/cause.repository";
import { IDonationRepository } from "../donation/donation.repository";
import { IUserRepository } from "../user/user.repository";
import {
  BADGE_META,
  BadgeMeta,
  LevelInfo,
  computeLevel,
  computeNewBadges,
  computeXpForDonation,
} from "../donation/gamification.service";
import { mpPaymentClient } from "../../lib/mercadopago";
import { IPaymentRepository } from "./payment.repository";
import { InitiatePaymentDTO } from "./payment.schema";

export type InitiatePaymentResult = {
  paymentId:    string;
  qrCode:       string;
  qrCodeBase64: string;
  amount:       number;
  causeTitle:   string;
  status:       string;
};

export type WebhookPayload = {
  type?:   string;
  action?: string;
  data?:   { id: string };
};

export type WebhookResult = {
  processed: boolean;
  reason?:   string;
  xpEarned?: number;
  newBadges?: BadgeMeta[];
  level?:     LevelInfo;
};

export class PaymentService {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly causeRepository:   ICauseRepository,
    private readonly userRepository:    IUserRepository,
    private readonly donationRepository: IDonationRepository,
    private readonly prisma:            PrismaClient,
  ) {}

  async initiatePayment(
    data:       InitiatePaymentDTO,
    userId:     string,
    payerEmail: string,
  ): Promise<InitiatePaymentResult> {
    const cause = await this.causeRepository.findById(data.causeId);
    if (!cause)                   throw new Error("Cause not found");
    if (cause.status !== "ACTIVE") throw new Error("Cause is not accepting donations");

    // Cria o Payment no banco com status PENDING antes de chamar o MP
    const payment = await this.paymentRepository.create({
      amount:     data.amount,
      message:    data.message,
      userId,
      causeId:    data.causeId,
      payerEmail,
    });

    // Chama o Mercado Pago para gerar o PIX
    const mpResponse = await mpPaymentClient.create({
      body: {
        transaction_amount: data.amount,
        payment_method_id:  "pix",
        payer:              { email: payerEmail },
        description:        `Doação para: ${cause.title}`,
        external_reference: payment.id,
        notification_url:   `${process.env.APP_URL ?? "http://localhost:3000"}/payments/webhook`,
      },
      requestOptions: { idempotencyKey: payment.id },
    });

    const mpPaymentId  = String(mpResponse.id);
    const qrCode       = mpResponse.point_of_interaction?.transaction_data?.qr_code       ?? "";
    const qrCodeBase64 = mpResponse.point_of_interaction?.transaction_data?.qr_code_base64 ?? "";

    // Atualiza o Payment com os dados do MP
    await this.paymentRepository.updateStatus(payment.id, "PENDING", {
      mpPaymentId,
      qrCode,
      qrCodeBase64,
    });

    return {
      paymentId: payment.id,
      qrCode,
      qrCodeBase64,
      amount:    data.amount,
      causeTitle: cause.title,
      status:    "PENDING",
    };
  }

  // Chamado pelo webhook do Mercado Pago
  async handleWebhook(body: WebhookPayload): Promise<WebhookResult> {
    // MP envia type "payment" para notificações de pagamento
    if (body.type !== "payment" || !body.data?.id) {
      return { processed: false, reason: "not_a_payment_event" };
    }

    const mpPaymentId = body.data.id;

    // Busca os detalhes do pagamento no MP para pegar o status real
    let mpData: any;
    try {
      mpData = await mpPaymentClient.get({ id: mpPaymentId });
    } catch (err) {
      console.error(`[webhook] Erro ao buscar pagamento ${mpPaymentId} no MP:`, err);
      return { processed: false, reason: "mp_fetch_error" };
    }

    const mpStatus = mpData?.status;

    // Se não foi aprovado, apenas atualiza o status no banco se necessário
    if (mpStatus !== "approved") {
      const payment = await this.paymentRepository.findByMpId(mpPaymentId);
      if (payment && payment.status === "PENDING") {
        const statusMap: Record<string, "REJECTED" | "CANCELLED"> = {
          rejected:  "REJECTED",
          cancelled: "CANCELLED",
        };
        const mapped = statusMap[mpStatus];
        if (mapped) await this.paymentRepository.updateStatus(payment.id, mapped);
      }
      return { processed: false, reason: `status_is_${mpStatus}` };
    }

    const payment = await this.paymentRepository.findByMpId(mpPaymentId);
    if (!payment)                   return { processed: false, reason: "payment_not_found" };
    if (payment.status === "APPROVED") return { processed: false, reason: "already_processed" };

    // Calcula XP e badges com base no estado atual do usuário
    const stats = await this.donationRepository.getUserStats(payment.userId);
    const donationCountAfter = stats.donationCount + 1;
    const totalDonatedAfter  = stats.totalDonated  + payment.amount;

    const xpEarned    = computeXpForDonation(payment.amount, donationCountAfter);
    const newBadgeKeys = computeNewBadges(donationCountAfter, totalDonatedAfter, stats.earnedBadgeKeys);

    await this.prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          amount:   payment.amount,
          message:  payment.message,
          userId:   payment.userId,
          causeId:  payment.causeId,
          xpEarned,
        },
      });

      await tx.cause.update({
        where: { id: payment.causeId },
        data:  {
          raised:   { increment: payment.amount },
          balance:  { increment: payment.amount },
        },
      });

      await tx.user.update({
        where: { id: payment.userId },
        data:  {
          xpPoints: { increment: xpEarned },
          balance:  { increment: payment.amount },
        },
      });

      if (newBadgeKeys.length > 0) {
        await tx.userBadge.createMany({
          data:           newBadgeKeys.map((badgeKey) => ({ userId: payment.userId, badgeKey, imageUrl: null })),
          skipDuplicates: true,
        });
      }

      await tx.payment.update({
        where: { id: payment.id },
        data:  { status: "APPROVED", donationId: donation.id },
      });
    });

    const updatedUser = await this.userRepository.findById(payment.userId);
    const currentXp   = updatedUser?.xpPoints ?? 0;

    return {
      processed: true,
      xpEarned,
      newBadges: newBadgeKeys.map((k) => BADGE_META[k]),
      level:     computeLevel(currentXp),
    };
  }

  async findByUser(userId: string, skip = 0, take = 20) {
    return this.paymentRepository.findByUser(userId, skip, take);
  }

  async findByCause(causeId: string, skip = 0, take = 20) {
    return this.paymentRepository.findByCause(causeId, skip, take);
  }

  async findById(id: string) {
    return this.paymentRepository.findById(id);
  }
}
