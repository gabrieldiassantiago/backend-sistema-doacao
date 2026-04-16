import Elysia, { t } from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { container } from "../../container";
import { ForbiddenError, NotFoundError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";
import {
  CauseParamsSchema,
  CreateCauseSchema,
  UpdateCauseSchema,
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

      const causes = await causeService.getActiveCauses(
        Number(query.skip) || 0,
        Number(query.take) || 20
      );

      pino.info(`Causas ativas buscadas com sucesso. Tempo: ${Date.now() - startTime}ms. Total: ${causes.length} causas`);

      return Promise.all(causes.map((cause) => withSignedImages(cause)));
    },
    {
      query: t.Object({
        skip: t.Optional(t.Numeric()),
        take: t.Optional(t.Numeric()),
      }),
      detail: { tags: ["Causes"], summary: "Listar causas ativas" },
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
  );