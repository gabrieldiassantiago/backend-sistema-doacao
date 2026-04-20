import { t } from "elysia";

export const CreateCauseSchema = t.Object({
    title: t.String({ minLength: 1 }),
    description: t.String({ minLength: 1 }),
    goalAmount: t.Numeric({ minimum: 1 }),
    categoryId: t.String(),
    images: t.Optional(t.Files()),
    imageKeys: t.Optional(t.Array(t.String())),
    isFeatured: t.Optional(t.BooleanString()),

    locationName: t.Optional(t.String()),
    address: t.Optional(t.String()),
    city: t.Optional(t.String()),
    state: t.Optional(t.String()),
    country: t.Optional(t.String()),
    latitude: t.Optional(t.Numeric({ minimum: -90, maximum: 90 })),
    longitude: t.Optional(t.Numeric({ minimum: -180, maximum: 180 })),
});

export const UpdateCauseSchema = t.Object({
    title: t.Optional(t.String({ minLength: 1 })),
    description: t.Optional(t.String({ minLength: 1 })),
    goalAmount: t.Optional(t.Numeric({ minimum: 1 })),
    categoryId: t.Optional(t.String()),
    images: t.Optional(t.Files()),
    imageKeys: t.Optional(t.Array(t.String())),
    isFeatured: t.Optional(t.BooleanString()),

    // Localização
    locationName: t.Optional(t.String()),
    address: t.Optional(t.String()),
    city: t.Optional(t.String()),
    state: t.Optional(t.String()),
    country: t.Optional(t.String()),
    latitude: t.Optional(t.Numeric({ minimum: -90, maximum: 90 })),
    longitude: t.Optional(t.Numeric({ minimum: -180, maximum: 180 })),
});

export const CauseParamsSchema = t.Object({
    id: t.String(),
});

export type CreateCauseDTO = typeof CreateCauseSchema.static;
export type UpdateCauseDTO = typeof UpdateCauseSchema.static;
export type CauseParams = typeof CauseParamsSchema.static;