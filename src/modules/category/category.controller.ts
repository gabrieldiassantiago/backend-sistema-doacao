import Elysia, { t } from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { container } from "../../container";
import { NotFoundError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";
import {
  CategoryParamsSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
} from "./category.schema";

const { categoryService } = container;

export const categoryController = new Elysia({ prefix: "/categories" })
  .use(betterAuthMiddleware)

  .get(
    "/",
    ({ query }) => categoryService.getAll(Number(query.skip) || 0, Number(query.take) || 20),
    {
      query: t.Object({
        skip: t.Optional(t.Numeric()),
        take: t.Optional(t.Numeric()),
      }),
      detail: { tags: ["Categories"], summary: "Listar categorias" },
    }
  )

  .get(
    "/:id",
    async ({ params }) => {
      const category = await categoryService.getById(params.id);
      if (!category) {
        throw new NotFoundError("Categoria não encontrada", ErrorCodes.CATEGORY_NOT_FOUND);
      }
      return category;
    },
    {
      params: CategoryParamsSchema,
      detail: { tags: ["Categories"], summary: "Buscar categoria por ID" },
    }
  )

  .post(
    "/",
    async ({ body }) => categoryService.create(body),
    {
      auth: true,
      body: CreateCategorySchema,
      detail: { tags: ["Categories"], summary: "Criar categoria" },
    }
  )

  .patch(
    "/:id",
    async ({ params, body }) => categoryService.update(params.id, body),
    {
      auth: true,
      params: CategoryParamsSchema,
      body: UpdateCategorySchema,
      detail: { tags: ["Categories"], summary: "Atualizar categoria" },
    }
  )

  .delete(
    "/:id",
    async ({ params }) => categoryService.delete(params.id),
    {
      auth: true,
      params: CategoryParamsSchema,
      detail: { tags: ["Categories"], summary: "Deletar categoria" },
    }
  );
