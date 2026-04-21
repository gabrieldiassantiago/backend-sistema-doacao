import Elysia, { t } from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { container } from "../../container";
import { CreateWithdrawalSchema, WithdrawalParamsSchema } from "./withdrawal.schema";
import { NotFoundError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";

const { withdrawalService } = container;

export const withdrawalController = new Elysia({ prefix: "/withdrawals" })
  .use(betterAuthMiddleware)

  // Solicita um saque via PIX para o dono da causa
  .post(
    "/",
    async ({ body, user }) => withdrawalService.create(body, user.id),
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
    ({ params, user, query }) =>
      withdrawalService.findByCause(
        params.causeId,
        user.id,
        Number(query.skip) || 0,
        Number(query.take) || 20,
      ),
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
    async ({ params }) => {
      const w = await withdrawalService.findById(params.id);
      if (!w) {
        throw new NotFoundError("Saque não encontrado", ErrorCodes.WITHDRAWAL_NOT_FOUND);
      }
      return w;
    },
    {
      params: WithdrawalParamsSchema,
      detail: { tags: ["Withdrawals"], summary: "Buscar saque por ID" },
    },
  );
