import Elysia, { t } from "elysia";
import { betterAuthMiddleware } from "../../middleware/auth";
import { OtpService } from "./otp.service";
import { prisma } from "../../lib/prisma";

const otpService = new OtpService(prisma);

export const otpController = new Elysia({ prefix: "/otp" })
  .use(betterAuthMiddleware)

  .post(
    "/send",
    async ({ user, set }) => {
      if (user.emailVerified) {
        set.status = 400;
        return { message: "Seu email já foi verificado." };
      }

      try {
        await otpService.sendOTP(user.email, user.name);
        return { message: "Código enviado para seu email." };
      } catch (err: any) {
        set.status = 429;
        return { message: err.message ?? "Erro ao enviar código." };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["OTP"],
        summary: "Enviar código de verificação por email",
        description:
          "Gera um código OTP de 6 dígitos, válido por 10 minutos, e envia ao email do usuário autenticado. Possui cooldown de 60 segundos entre reenvios.",
      },
    },
  )

  .post(
    "/verify",
    async ({ body, user, set }) => {
      const result = await otpService.verifyOTP(user.email, body.otp, user.id);

      if (!result.success) {
        set.status = 400;
        return { message: result.reason ?? "Código inválido ou expirado." };
      }

      return { message: "Email verificado com sucesso!" };
    },
    {
      auth: true,
      body: t.Object({
        otp: t.String({
          minLength: 6,
          maxLength: 6,
          pattern: "^[0-9]{6}$",
          description: "Código OTP de 6 dígitos recebido por email",
          examples: ["847392"],
        }),
      }),
      detail: {
        tags: ["OTP"],
        summary: "Verificar código OTP",
        description:
          "Valida o código de 6 dígitos informado e, se correto, marca o email do usuário como verificado.",
      },
    },
  );
