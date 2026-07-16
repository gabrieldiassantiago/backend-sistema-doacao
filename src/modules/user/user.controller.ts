import Elysia from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { container } from "../../container";
import { UpdateUserSchema, UserParamsSchema } from "./user.schema";
import { NotFoundError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";

const { userService, storageService } = container;

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

    const createdCauses = (profile.createdCauses ?? []).map((cause) => ({
      ...cause,
      images: (cause.images ?? []).map((img) => ({
        ...img,
        url: img.key ? storageService.presignRead(img.key) : img.url ?? null,
      })),
    }));

    return {
      ...profile,
      createdCauses,
      imageUrl: profile.image ? storageService.presignRead(profile.image) : null,
    };
  },
  {
    auth: true,
    detail: { tags: ["Users"], summary: "Meu perfil completo (donations + causes)" },
  }
)

  .get(
    "/me",
    ({ user }) => ({
      ...user,
      imageUrl: user.image ? storageService.presignRead(user.image) : null,
    }),
    {
      auth: true,
      detail: { tags: ["Users"], summary: "Meu perfil" },
    }
  )

  .patch(
    "/me",
    async ({ body, user }) => {
      const updateData = {
        name: body.name,
        isAnonymous: body.isAnonymous,
      } as { name?: string; isAnonymous?: boolean; image?: string | null };

      if (body.image !== undefined) {
        if (typeof body.image === "string") {
          updateData.image = body.image;
        } else {
          updateData.image = await storageService.uploadUserAvatar(body.image);
        }
      }

      return userService.update(user.id, updateData);
    },
    {
      auth: true,
      body: UpdateUserSchema,
      detail: { tags: ["Users"], summary: "Atualizar meu perfil" },
    }
  );
