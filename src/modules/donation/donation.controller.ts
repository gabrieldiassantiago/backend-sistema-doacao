import Elysia, { t } from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { container } from "../../container";
import { CreateDonationSchema, DonationParamsSchema } from "./donation.schema";
import { NotFoundError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";

const { donationService } = container;

export const donationController = new Elysia({ prefix: "/donations" })
  .use(betterAuthMiddleware)


  // top doadores
  .get(
    "/leaderboard",
    ({ query }) => donationService.getLeaderboard(Number(query.take) || 10),
    {
      query: t.Object({ take: t.Optional(t.Numeric()) }),
      detail: { tags: ["Donations"], summary: "Top doadores por XP (leaderboard)" },
    }
  )

  // Doações de uma causa específica
  .get(
    "/cause/:causeId",
    ({ params, query }) =>
      donationService.findByCause(
        params.causeId,
        Number(query.skip) || 0,
        Number(query.take) || 20,
      ),
    {
      params: t.Object({ causeId: t.String() }),
      query: t.Object({
        skip: t.Optional(t.Numeric()),
        take: t.Optional(t.Numeric()),
      }),
      detail: { tags: ["Donations"], summary: "Listar doações de uma causa" },
    }
  )

  // Donation por ID
  .get(
    "/:id",
    async ({ params }) => {
      const donation = await donationService.findById(params.id);
      if (!donation) {
        throw new NotFoundError("Doação não encontrada", ErrorCodes.DONATION_NOT_FOUND);
      }
      return donation;
    },
    {
      params: DonationParamsSchema,
      detail: { tags: ["Donations"], summary: "Buscar doação por ID" },
    }
  )


  // Histórico de doações do usuário logado
  
  .get(
    "/me",
    ({ user, query }) =>
      donationService.findByUser(
        user.id,
        Number(query.skip) || 0,
        Number(query.take) || 20,
      ),
    {
      auth: true,
      query: t.Object({
        skip: t.Optional(t.Numeric()),
        take: t.Optional(t.Numeric()),
      }),
      detail: { tags: ["Donations"], summary: "Meu histórico de doações" },
    }
  )

  .post(
    "/",
    async ({ body, user }) =>
      donationService.create({ ...body, userId: user.id }),
    {
      auth: true,
      body: CreateDonationSchema,
      detail: {
        tags: ["Donations"],
        summary: "Fazer uma doação",
        description:
          "Cria uma doação e automaticamente concede XP e badges ao doador. " +
          "A resposta inclui os pontos ganhos, badges desbloqueados e o nível atual.",
      },
    }
  );
