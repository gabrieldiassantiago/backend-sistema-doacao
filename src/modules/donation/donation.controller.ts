import Elysia, { t } from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { container } from "../../container";
import { CreateDonationSchema, DonationParamsSchema } from "./donation.schema";

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
    async ({ params, set }) => {
      const donation = await donationService.findById(params.id);
      if (!donation) {
        set.status = 404;
        return { message: "Donation not found" };
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
    async ({ body, user, set }) => {
      try {
        return await donationService.create({ ...body, userId: user.id });
      } catch (e: any) {
        if (e.message === "Cause not found") {
          set.status = 404;
          return { message: e.message };
        }
        if (e.message === "Cause is not accepting donations") {
          set.status = 400;
          return { message: e.message };
        }
        throw e;
      }
    },
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
