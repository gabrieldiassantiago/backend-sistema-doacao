import Elysia, { t } from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { PaymentService } from "./payment.service";
import { PaymentRepository } from "./payment.repository";
import { CauseRepository } from "../cause/cause.repository";
import { UserRepository } from "../user/user.repository";
import { DonationRepository } from "../donation/donation.repository";
import { prisma } from "../../lib/prisma";
import { InitiatePaymentSchema, WebhookSchema } from "./payment.schema";

const paymentService = new PaymentService(
  new PaymentRepository(prisma),
  new CauseRepository(prisma),
  new UserRepository(prisma),
  new DonationRepository(prisma),
  prisma,
);

export const paymentController = new Elysia({ prefix: "/payments" })
  .use(betterAuthMiddleware)

  // Inicia um pagamento PIX — retorna QR Code para o usuário escanear
  .post(
    "/initiate",
    async ({ body, user, set }) => {
      try {
        return await paymentService.initiatePayment(body, user.id, user.email);
      } catch (e: any) {
        if (e.message === "Cause not found")               { set.status = 404; return { message: e.message }; }
        if (e.message === "Cause is not accepting donations") { set.status = 400; return { message: e.message }; }
        throw e;
      }
    },
    {
      auth: true,
      body: InitiatePaymentSchema,
      detail: {
        tags: ["Payments"],
        summary: "Iniciar pagamento PIX para uma causa",
        description:
          "Cria um pagamento via Mercado Pago e retorna o QR Code PIX. " +
          "Ao escanear e pagar, o webhook do MP dispara a criação da doação e a gamificação automaticamente.",
      },
    },
  )

  // Webhook público — Mercado Pago chama este endpoint após confirmação do pagamento
  .post(
    "/webhook",
    async ({ body, set }) => {
      try {
        const result = await paymentService.handleWebhook(body as any);
        set.status = 200;
        return { received: true, ...result };
      } catch (e) {
        console.error("[webhook] Erro inesperado:", e);
        set.status = 200; // sempre retornar 200 pro MP não retentar desnecessariamente
        return { received: true };
      }
    },
    {
      body: WebhookSchema,
      detail: {
        tags: ["Payments"],
        summary: "Webhook do Mercado Pago (público)",
        description:
          "Endpoint chamado automaticamente pelo MP. Valida o status do pagamento, " +
          "cria a Donation, atualiza saldos da causa/usuário e processa gamificação.",
      },
    },
  )

  // Busca um pagamento específico pelo ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const payment = await paymentService.findById(params.id);
      if (!payment) { set.status = 404; return { message: "Payment not found" }; }
      return payment;
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ["Payments"], summary: "Buscar pagamento por ID" },
    },
  )

  // Histórico de pagamentos do usuário autenticado
  .get(
    "/me",
    ({ user, query }) =>
      paymentService.findByUser(user.id, Number(query.skip) || 0, Number(query.take) || 20),
    {
      auth: true,
      query: t.Object({
        skip: t.Optional(t.Numeric()),
        take: t.Optional(t.Numeric()),
      }),
      detail: { tags: ["Payments"], summary: "Meu histórico de pagamentos" },
    },
  )

  // Pagamentos de uma causa (para o dono acompanhar entradas)
  .get(
    "/cause/:causeId",
    ({ params, query }) =>
      paymentService.findByCause(params.causeId, Number(query.skip) || 0, Number(query.take) || 20),
    {
      params: t.Object({ causeId: t.String() }),
      query: t.Object({
        skip: t.Optional(t.Numeric()),
        take: t.Optional(t.Numeric()),
      }),
      detail: { tags: ["Payments"], summary: "Pagamentos recebidos por uma causa" },
    },
  );
