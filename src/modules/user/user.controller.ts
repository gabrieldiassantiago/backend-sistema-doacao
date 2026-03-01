import Elysia from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { prisma } from "../../lib/prisma";
import { UpdateUserSchema, UserParamsSchema } from "./user.schema";

const userService = new UserService(new UserRepository(prisma));

export const userController = new Elysia({ prefix: "/users" })
  .use(betterAuthMiddleware)

  .get(
    "/:id",
    async ({ params, set }) => {
      const user = await userService.findById(params.id);
      if (!user) {
        set.status = 404;
        return { message: "User not found" };
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
    async ({ user, set }) => {
      const profile = await userService.getProfile(user.id);
      if (!profile) {
        set.status = 404;
        return { message: "User not found" };
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
    async ({ body, user, set }) => {
      try {
        return await userService.update(user.id, body);
      } catch (e: any) {
        set.status = 400;
        return { message: e.message };
      }
    },
    {
      auth: true,
      body: UpdateUserSchema,
      detail: { tags: ["Users"], summary: "Atualizar meu perfil" },
    }
  );
