import { t } from "elysia";

export const UpdateUserSchema = t.Object({
    name: t.Optional(t.String({ minLength: 2 })),
    image: t.Optional(t.Union([t.String(), t.File()])),
    isAnonymous: t.Optional(t.Boolean()),
});

export const UserParamsSchema = t.Object({
    id: t.String(),
});

export type UpdateUserDTO = typeof UpdateUserSchema.Type;
