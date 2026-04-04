import Elysia, { t } from "elysia";
import { OtpService } from "./otp.service";
import { prisma } from "../../lib/prisma";
import { BadRequestError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";

const otpService = new OtpService(prisma);

export const otpController = new Elysia({ prefix: "/otp" })
  .post(
    "/send",
    async ({ body }) => {

      await otpService.sendOTP(body.email, body.email.split('@')[0]);
      return { message: "Código enviado para seu email." };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" })
      }),
      detail: {
        tags: ["OTP"],
        summary: "Reenviar código de verificação",
      },
    },
  )

  .post(
    "/verify",
    async ({ body }) => {

      const user = await prisma.user.findUnique({
        where: { email: body.email }
      });
      if (!user) throw new BadRequestError("Usuário não encontrado.", ErrorCodes.BAD_REQUEST);

      await otpService.verifyOTP(body.email, body.otp, user.id);
      return { message: "Email verificado com sucesso!" };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        otp: t.String({
          minLength: 6,
          maxLength: 6,
          pattern: "^[0-9]{6}$",
        }),
      }),
      detail: {
        tags: ["OTP"],
        summary: "Verificar código OTP (Deslogado)",
      },
    },
  );
