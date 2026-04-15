import Elysia from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { container } from "../../container";
import { UpdateUserSchema, UserParamsSchema } from "./user.schema";
import { NotFoundError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";

const { userService } = container;

export const userController = new Elysia({ prefix: "/users" })
  .use(betterAuthMiddleware)

  .get(
    "/:id",
    async ({ params }) => {
      const user = await userService.findById(params.id);
      if (!user) {
        throw new NotFoundError("Usuário não encontrado", ErrorCodes.USER_NOT_FOUND);
      }
      return user;
    },
    {
      params: UserParamsSchema,
      detail: { tags: ["Users"], summary: "Buscar usuário por ID" },
    }
  )

  .get(
    "/me/profile",
    async ({ user }) => {
      const profile = await userService.getProfile(user.id);
      if (!profile) {
        throw new NotFoundError("Usuário não encontrado", ErrorCodes.USER_NOT_FOUND);
      }
      return profile;
    },
    {
      auth: true,
      detail: { tags: ["Users"], summary: "Meu perfil completo (donations + causes)" },
    }
  )

  .get(
    "/me",
    ({ user }) => user,
    {
      auth: true,
      detail: { tags: ["Users"], summary: "Meu perfil" },
    }
  )

  .patch(
    "/me",
    async ({ body, user }) => userService.update(user.id, body),
    {
      auth: true,
      body: UpdateUserSchema,
      detail: { tags: ["Users"], summary: "Atualizar meu perfil" },
    }
  );
