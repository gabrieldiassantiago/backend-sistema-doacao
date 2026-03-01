import { t } from "elysia";

export const UpdateUserSchema = t.Object({
    name: t.Optional(t.String({ minLength: 2 })),
    image: t.Optional(t.String()),
});

export const UserParamsSchema = t.Object({
    id: t.String(),
});

export type UpdateUserDTO = typeof UpdateUserSchema.Type;
