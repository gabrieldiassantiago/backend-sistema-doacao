import Elysia, { t } from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { container } from "../../container";
import { CreateWithdrawalSchema, WithdrawalParamsSchema } from "./withdrawal.schema";

const { withdrawalService } = container;

export const withdrawalController = new Elysia({ prefix: "/withdrawals" })
  .use(betterAuthMiddleware)

  // Solicita um saque via PIX para o dono da causa
  .post(
    "/",
    async ({ body, user, set }) => {
      try {
        return await withdrawalService.create(body, user.id);
      } catch (e: any) {
        if (e.message === "Cause not found")     { set.status = 404; return { message: e.message }; }
        if (e.message === "Unauthorized")        { set.status = 403; return { message: "Você não é o dono desta causa" }; }
        if (e.message === "Insufficient balance") { set.status = 400; return { message: "Saldo insuficiente na causa" }; }
        if (e.message?.startsWith("Transferência falhou")) { set.status = 502; return { message: e.message }; }
        throw e;
      }
    },
    {
      auth: true,
      body: CreateWithdrawalSchema,
      detail: {
        tags: ["Withdrawals"],
        summary: "Sacar saldo da causa via PIX",
        description:
          "Somente o dono da causa pode sacar. " +
          "O saldo é reservado antes de chamar o MP — se a transferência falhar, o saldo é revertido automaticamente.",
      },
    },
  )

  // Histórico de saques do usuário autenticado
  .get(
    "/me",
    ({ user, query }) =>
      withdrawalService.findByUser(user.id, Number(query.skip) || 0, Number(query.take) || 20),
    {
      auth: true,
      query: t.Object({
        skip: t.Optional(t.Numeric()),
        take: t.Optional(t.Numeric()),
      }),
      detail: { tags: ["Withdrawals"], summary: "Meus saques" },
    },
  )

  // Histórico de saques de uma causa (somente o dono acessa)
  .get(
    "/cause/:causeId",
    async ({ params, user, query, set }) => {
      try {
        return await withdrawalService.findByCause(
          params.causeId,
          user.id,
          Number(query.skip) || 0,
          Number(query.take) || 20,
        );
      } catch (e: any) {
        if (e.message === "Cause not found") { set.status = 404; return { message: e.message }; }
        if (e.message === "Unauthorized")    { set.status = 403; return { message: "Acesso negado" }; }
        throw e;
      }
    },
    {
      auth: true,
      params: t.Object({ causeId: t.String() }),
      query: t.Object({
        skip: t.Optional(t.Numeric()),
        take: t.Optional(t.Numeric()),
      }),
      detail: { tags: ["Withdrawals"], summary: "Saques de uma causa (somente dono)" },
    },
  )

  // Busca um saque por ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const w = await withdrawalService.findById(params.id);
      if (!w) { set.status = 404; return { message: "Withdrawal not found" }; }
      return w;
    },
    {
      params: WithdrawalParamsSchema,
      detail: { tags: ["Withdrawals"], summary: "Buscar saque por ID" },
    },
  );
