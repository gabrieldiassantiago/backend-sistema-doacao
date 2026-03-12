import type { ICauseRepository } from "../cause/cause.types";
import type { IDonationService } from "../donation/donation.types";
import type { IUserRepository } from "../user/user.types";
import { mpPaymentClient } from "../../lib/mercadopago";
import type {
  InitiatePaymentResult,
  IPaymentRepository,
  IPaymentService,
  WebhookPayload,
  WebhookResult,
} from "./payment.types";
import type { InitiatePaymentDTO } from "./payment.schema";

export class PaymentService implements IPaymentService {
  constructor(
    private readonly paymentRepository:  IPaymentRepository,
    private readonly causeRepository:    ICauseRepository,
    private readonly userRepository:     IUserRepository,
    private readonly donationService:    IDonationService,
  ) {}

  async initiatePayment(
    data:       InitiatePaymentDTO,
    userId:     string,
    payerEmail: string,
  ): Promise<InitiatePaymentResult> {

    const cause = await this.causeRepository.findById(data.causeId);
    
    if (!cause)                   throw new Error("Causa não encontrada");

    if (cause.status !== "ACTIVE") throw new Error("Causa não está aceitando doações");

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
        notification_url:   'https://e114-2804-14c-418f-81fc-6e8a-b3ca-3bd4-d6b4.ngrok-free.app/payments/webhook', // URL do webhook para receber notificações do MP
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
    if (!payment)                      return { processed: false, reason: "payment_not_found" };
    if (payment.status === "APPROVED") return { processed: false, reason: "already_processed" };

    const result = await this.donationService.createFromPayment({
      id:      payment.id,
      amount:  payment.amount,
      message: payment.message,
      userId:  payment.userId,
      causeId: payment.causeId,
    });

    return {
      processed: true,
      xpEarned:  result.xpEarned,
      newBadges: result.newBadges,
      level:     result.level,
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
