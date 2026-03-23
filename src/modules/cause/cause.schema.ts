import { t } from "elysia";

export const CreateCauseSchema = t.Object({
    title: t.String({ minLength: 1 }),
    description: t.String({ minLength: 1 }),
    goalAmount: t.Numeric({ minimum: 1 }),
    images: t.Files({ minItems: 1 }),
    isFeatured: t.Optional(t.BooleanString())
})

export const UpdateCauseSchema = t.Object({
    title: t.Optional(t.String({ minLength: 1 })),
    description: t.Optional(t.String({ minLength: 1 })),
    goalAmount: t.Optional(t.Numeric({ minimum: 1 })),
    images: t.Optional(t.Files()),
    isFeatured: t.Optional(t.BooleanString())
})  

export const CauseParamsSchema = t.Object({
    id: t.String()
})

export type CreateCauseSchema = typeof CreateCauseSchema.Type
export type UpdateCauseDTO = typeof UpdateCauseSchema.Type
export type CauseParams = typeof CauseParamsSchema.Type