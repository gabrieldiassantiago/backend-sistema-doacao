import { t } from "elysia";

export const CreateCauseSchema = t.Object({
    title: t.String(),
    description: t.String(),
    goalAmount: t.Number(),
    imageUrl: t.Optional(t.String()),
    isFeatured: t.Optional(t.Boolean())
})

export const UpdateCauseSchema = t.Object({
    title: t.Optional(t.String()),
    description: t.Optional(t.String()),
    goalAmount: t.Optional(t.Number()),
    imageUrl: t.Optional(t.String()),
    isFeatured: t.Optional(t.Boolean())
})

export const CauseParamsSchema = t.Object({
    id: t.String()
})

export type CreateCauseSchema = typeof CreateCauseSchema.Type
export type UpdateCauseDTO = typeof UpdateCauseSchema.Type
export type CauseParams = typeof CauseParamsSchema.Type