import Elysia, { t } from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { CauseService } from "./cause.service";
import { CauseRepository } from "./cause.repository";
import { prisma } from "../../lib/prisma";
import {
  CauseParamsSchema,
  CreateCauseSchema,
  UpdateCauseSchema,
} from "./cause.schema";

const causeService = new CauseService(new CauseRepository(prisma));

export const causeController = new Elysia({ prefix: "/causes" })

  .use(betterAuthMiddleware)

  .get(
    "/",
    ({ query }) =>
      causeService.getActiveCauses(
        Number(query.skip) || 0,
        Number(query.take) || 20
      ),
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
    async ({ params, set }) => {
      const cause = await causeService.getCauseById(params.id);
      if (!cause) {
        set.status = 404;
        return { message: "Causa não encontrada" };
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
    ({ body, user }) => causeService.create(body, user.id),
    {
      auth: true,
      body: CreateCauseSchema,
      detail: { tags: ["Causes"], summary: "Criar nova causa" },
    }
  )

  .patch(
    "/:id",
    async ({ params, body, user, set }) => {
      try {
        return await causeService.updateCause(params.id, body, user.id);
      } catch (e: any) {
        if (e.message === "Você não tem permissão para atualizar esta causa") { set.status = 403; return { message: e.message }; }
        if (e.message === "Causa não encontrada") { set.status = 404; return { message: e.message }; }
        throw e;
      }
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
    async ({ params, user, set }) => {
      try {
        return await causeService.deleteCause(params.id, user.id);
      } catch (e: any) {
        if (e.message === "Você não tem permissão para deletar esta causa") { set.status = 403; return { message: e.message }; }
        if (e.message === "Causa não encontrada") { set.status = 404; return { message: e.message }; }
        throw e;
      }
    },
    {
      auth: true,
      params: CauseParamsSchema,
      detail: { tags: ["Causes"], summary: "Deletar causa" },
    }
  );
