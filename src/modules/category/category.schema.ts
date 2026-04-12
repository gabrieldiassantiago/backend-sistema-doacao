import { t } from "elysia";

export const CreateCategorySchema = t.Object({
  name: t.String({ minLength: 1 }),
  description: t.Optional(t.String({ minLength: 1 })),
});

export const UpdateCategorySchema = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String({ minLength: 1 })),
});

export const CategoryParamsSchema = t.Object({
  id: t.String(),
});

export type CreateCategoryDTO = typeof CreateCategorySchema.Type;
export type UpdateCategoryDTO = typeof UpdateCategorySchema.Type;
export type CategoryParams = typeof CategoryParamsSchema.Type;
