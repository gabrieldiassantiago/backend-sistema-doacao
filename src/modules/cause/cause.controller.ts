import Elysia, { t } from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { container } from "../../container";
import { ForbiddenError, NotFoundError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";
import {
  CauseParamsSchema,
  CreateCauseSchema,
  UpdateCauseSchema,
  GetCausesQuerySchema,
  AddDocumentSchema,
  ReviewDocumentSchema,
  ModerateCauseSchema
} from "./cause.schema";


const { causeService, storageService } = container;

type CauseWithImages = {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raised: number;
  status: string;
  isVerified: boolean;
  isFeatured: boolean;
  authorId: string;
  categoryId: string | null;
  balance: number;
  isGoalReached: boolean;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    name: string;
    image: string | null;
  };
  category?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  images: {
    id: string;
    key: string;
    position: number;
    createdAt: Date;
  }[];
  _count?: {
    donations: number;
  };
};

const withSignedImages = async <T extends CauseWithImages>(cause: T) => {
  const imageKeys = cause.images?.map((image) => image.key) ?? [];
  const signedUrls = await storageService.getReadUrls(imageKeys);

  return {
    ...cause,
    images: cause.images.map((image, index) => ({
      id: image.id,
      key: image.key,
      position: image.position,
      createdAt: image.createdAt,
      url: signedUrls[index] ?? null,
    })),
  };
};

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

      return Promise.all(causes.map((cause) => withSignedImages(cause)));
    },
    {
      query: GetCausesQuerySchema,
      detail: {
        tags: ["Causes"],
        summary: "Listar causas ativas com filtros",
        description: [
          "Retorna causas ativas com suporte a filtros e ordenação.",
          "",
          "**Ordenação (`sort`)**:",
          "- `recent` — mais recentes primeiro (padrão)",
          "- `most_popular` — maior número de doações primeiro",
          "- `most_urgent` — menor arrecadação primeiro (maior necessidade)",
          "- `nearest` — mais próximas do usuário (requer `lat` e `lng`)",
          "",
          "**Filtro por localização**:",
          "- `city` / `state` — texto parcial, case-insensitive",
          "- `lat` + `lng` + `radius` — coordenadas do usuário em graus decimais e raio em km (padrão 50 km)",
          "",
          "**Exemplo — perto de Recife num raio de 30 km**:",
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
          "Causa não encontrada",
          ErrorCodes.CAUSE_NOT_FOUND
        );
      }

      return withSignedImages(cause);
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

      pino.info({ causeId: createdCause.id, duration: Date.now() - startTime, images: uploadedImageKeys.length }, "Causa criada com sucesso");

      return withSignedImages(createdCause);
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
      const cause = await causeService.getCauseById(params.id);

      if (!cause) {
        throw new NotFoundError(
          "Causa não encontrada",
          ErrorCodes.CAUSE_NOT_FOUND
        );
      }

      if (cause.authorId !== user.id) {
        throw new ForbiddenError(
          "Você não tem permissão para atualizar esta causa",
          ErrorCodes.FORBIDDEN
        );
      }

      const currentImageKeys = cause.images.map((image) => image.key);

      const reorderedExistingKeys = body.imageKeys ?? currentImageKeys;

      const hasInvalidKey = reorderedExistingKeys.some(
        (key) => !currentImageKeys.includes(key)
      );

      if (hasInvalidKey) {
        throw new ForbiddenError(
          "Uma ou mais imagens enviadas não pertencem a esta causa",
          ErrorCodes.FORBIDDEN
        );
      }

      const uploadedImageKeys =
        body.images && body.images.length > 0
          ? await storageService.uploadImages(body.images)
          : [];

      const finalImageKeys =
        body.imageKeys || uploadedImageKeys.length > 0
          ? [...reorderedExistingKeys, ...uploadedImageKeys]
          : undefined;

      const updatedCause = await causeService.updateCause(
        params.id,
        {
          title: body.title,
          description: body.description,
          goalAmount: body.goalAmount,
          categoryId: body.categoryId,
          isFeatured: body.isFeatured,
          imageKeys: finalImageKeys,
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

      return withSignedImages(updatedCause);
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
      return await causeService.attachDocument(params.id, user.id, fileKey, fileName, body.docType as any);
    },
    {
      auth: true,
      params: CauseParamsSchema,
      body: AddDocumentSchema,
      detail: { tags: ["Causes", "Documents"], summary: "Anexar documento de verificação" },
    }
  )

  .get(
    "/:id/documents",
    async ({ params, user }) => {
      const documents = await causeService.getDocuments(params.id, user.id);

      return Promise.all(documents.map(async (doc) => ({
        ...doc,
        url: await storageService.getReadUrl(doc.fileKey)
      })));
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
      return await causeService.reviewDocument(params.docId, body.status as any, user.id, body.rejectionReason);
    },
    {
      auth: true,
      params: t.Object({ docId: t.String() }),
      body: ReviewDocumentSchema,
      detail: { tags: ["Causes", "Admin"], summary: "Aprovar ou rejeitar documento" },
    }
  )

  .get(
    "/admin/pending",
    async ({ user }) => {
        return await causeService.getPendingCauses(user.id);
    },
    {
      auth: true,
      detail: { tags: ["Causes", "Admin"], summary: "Listar causas aguardando aprovação" },
    }
  )

  .patch(
    "/admin/:id/moderate",
    async ({ params, body, user }) => {
      return await causeService.moderateCause(params.id, body.status, body.isVerified, user.id);
    },
    {
      auth: true,
      params: CauseParamsSchema,
      body: ModerateCauseSchema,
      detail: { tags: ["Causes", "Admin"], summary: "Moderar causa (Mudar status e verificação)" },
    }
  );