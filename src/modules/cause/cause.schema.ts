import { t } from "elysia";

export const CreateCauseSchema = t.Object({
    title: t.String({ minLength: 1 }),
    description: t.String({ minLength: 1 }),
    goalAmount: t.Number({ minimum: 1 }),
    imageUrl: t.Optional(t.String({ minLength: 1 })),
    isFeatured: t.Optional(t.Boolean())
})

export const UpdateCauseSchema = t.Object({
    title: t.Optional(t.String({ minLength: 1 })    ),
    description: t.Optional(t.String({ minLength: 1 })),
    goalAmount: t.Optional(t.Number({ minimum: 1 })),
    imageUrl: t.Optional(t.String({ minLength: 1 })),
    isFeatured: t.Optional(t.Boolean())
})

export const CauseParamsSchema = t.Object({
    id: t.String()
})

export type CreateCauseSchema = typeof CreateCauseSchema.Type
export type UpdateCauseDTO = typeof UpdateCauseSchema.Type
export type CauseParams = typeof CauseParamsSchema.Type