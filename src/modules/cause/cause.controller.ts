import Elysia, { t } from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { container } from "../../container";
import { NotFoundError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";
import {
  CauseParamsSchema,
  CreateCauseSchema,
  UpdateCauseSchema,
  GetCausesQuerySchema,
  AddDocumentSchema,
  ReviewDocumentSchema,
  ModerateCauseSchema,
} from "./cause.schema";

const { causeService, storageService } = container;

export const causeController = new Elysia({ prefix: "/causes" })
  .use(betterAuthMiddleware)

  .get(
    "/",
    async ({ query, store }) => {
      const { pino } = store as { pino: { info: (message: string) => void } };

      pino.info("Buscando causas ativas");

      const startTime = Date.now();

      const causes = await causeService.getActiveCauses({
        skip: query.skip ? Number(query.skip) : undefined,
        take: query.take ? Number(query.take) : undefined,
        sort: query.sort,
        city: query.city,
        state: query.state,
        lat: query.lat !== undefined ? Number(query.lat) : undefined,
        lng: query.lng !== undefined ? Number(query.lng) : undefined,
        radius: query.radius !== undefined ? Number(query.radius) : undefined,
        categoryId: query.categoryId,
        search: query.search,
      });

      pino.info(
        `Causas buscadas com sucesso. Tempo: ${Date.now() - startTime
        }ms. Total: ${causes.length} causas. sort=${query.sort ?? "recent"}`
      );

      return causes;
    },
    {
      query: GetCausesQuerySchema,
      detail: {
        tags: ["Causes"],
        summary: "Listar causas ativas com filtros",
        description: [
          "Retorna causas ativas com suporte a filtros e ordenacao.",
          "",
          "**Ordenacao (`sort`)**:",
          "- `recent` - mais recentes primeiro (padrao)",
          "- `most_popular` - maior numero de doacoes primeiro",
          "- `most_urgent` - menor arrecadacao primeiro (maior necessidade)",
          "- `nearest` - mais proximas do usuario (requer `lat` e `lng`)",
          "",
          "**Filtro por localizacao**:",
          "- `city` / `state` - texto parcial, case-insensitive",
          "- `lat` + `lng` + `radius` - coordenadas do usuario em graus decimais e raio em km (padrao 50 km)",
          "",
          "**Exemplo - perto de Recife num raio de 30 km**:",
          "```",
          "GET /causes?sort=nearest&lat=-8.0476&lng=-34.8770&radius=30",
          "```",
        ].join("\n"),
      },
    }
  )

  .get(
    "/:id",
    async ({ params }) => {
      const cause = await causeService.getCauseById(params.id);

      if (!cause) {
        throw new NotFoundError(
          "Causa nao encontrada",
          ErrorCodes.CAUSE_NOT_FOUND
        );
      }

      return cause;
    },
    {
      params: CauseParamsSchema,
      detail: { tags: ["Causes"], summary: "Buscar causa por ID" },
    }
  )

  .post(
    "/",
    async ({ body, user, store }) => {
      const { pino } = store as { pino: any };

      const startTime = Date.now();

      const uploadedImageKeys =
        body.images && body.images.length > 0
          ? await storageService.uploadImages(body.images)
          : [];

      const createdCause = await causeService.create(
        {
          title: body.title,
          description: body.description,
          goalAmount: body.goalAmount,
          categoryId: body.categoryId,
          imageKeys: uploadedImageKeys,
          isFeatured: body.isFeatured,
          locationName: body.locationName,
          address: body.address,
          city: body.city,
          state: body.state,
          country: body.country,
          latitude: body.latitude,
          longitude: body.longitude,
        },
        user.id
      );

      pino.info(
        {
          causeId: createdCause.id,
          duration: Date.now() - startTime,
          images: uploadedImageKeys.length,
        },
        "Causa criada com sucesso"
      );

      return createdCause;
    },
    {
      auth: true,
      body: CreateCauseSchema,
      detail: { tags: ["Causes"], summary: "Criar nova causa" },
    }
  )

  .patch(
    "/:id",
    async ({ params, body, user }) => {
      return await causeService.updateCause(
        params.id,
        {
          title: body.title,
          description: body.description,
          goalAmount: body.goalAmount,
          categoryId: body.categoryId,
          isFeatured: body.isFeatured,
          status: body.status,
          imageKeys: body.imageKeys,
          images: body.images,
          locationName: body.locationName,
          address: body.address,
          city: body.city,
          state: body.state,
          country: body.country,
          latitude: body.latitude,
          longitude: body.longitude,
        },
        user.id
      );
    },
    {
      auth: true,
      params: CauseParamsSchema,
      body: UpdateCauseSchema,
      detail: { tags: ["Causes"], summary: "Atualizar causa" },
    }
  )

  .delete(
    "/:id",
    async ({ params, user }) => {
      return await causeService.deleteCause(params.id, user.id);
    },
    {
      auth: true,
      params: CauseParamsSchema,
      detail: { tags: ["Causes"], summary: "Deletar causa" },
    }
  )

  .post(
    "/:id/documents",
    async ({ params, body, user }) => {
      const { fileKey, fileName } = await storageService.uploadDocument(body.file);
      return await causeService.attachDocument(params.id, user.id, fileKey, fileName, body.docType);
    },
    {
      auth: true,
      params: CauseParamsSchema,
      body: AddDocumentSchema,
      detail: { tags: ["Causes", "Documents"], summary: "Anexar documento de verificacao" },
    }
  )

  .get(
    "/:id/documents",
    async ({ params, user }) => {
      return await causeService.getDocuments(params.id, user.id);
    },
    {
      auth: true,
      params: CauseParamsSchema,
      detail: { tags: ["Causes", "Documents"], summary: "Listar documentos enviados da causa" },
    }
  )

  .patch(
    "/admin/documents/:docId/review",
    async ({ params, body, user }) => {
      return await causeService.reviewDocument(params.docId, body.status, user.id, body.rejectionReason);
    },
    {
      isAdmin: true,
      params: t.Object({ docId: t.String() }),
      body: ReviewDocumentSchema,
      detail: { tags: ["Causes", "Admin"], summary: "Aprovar ou rejeitar documento" },
    }
  )

  .get(
    "/admin/pending",
    async ({ user }) => {
      return await causeService.getPendingCauses();
    },
    {
      isAdmin: true,
      detail: { tags: ["Causes", "Admin"], summary: "Listar causas aguardando aprovacao" },
    }
  )

  .patch(
    "/admin/:id/moderate",
    async ({ params, body, user }) => {
      return await causeService.moderateCause(params.id, body.status, body.isVerified, user.id);
    },
    {
      isAdmin: true,
      params: CauseParamsSchema,
      body: ModerateCauseSchema,
      detail: { tags: ["Causes", "Admin"], summary: "Moderar causa (Mudar status e verificacao)" },
    }
  );
