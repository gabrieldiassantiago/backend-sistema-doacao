import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { auth, OpenAPI } from "./auth";
import { causeController } from "./modules/cause/cause.controller";
import { userController } from "./modules/user/user.controller";
import { donationController } from "./modules/donation/donation.controller";
import { otpController } from "./modules/otp/otp.controller";
import { OtpService } from "./modules/otp/otp.service";
import { prisma } from "./lib/prisma";
import cron from "@elysiajs/cron";

const otpService = new OtpService(prisma); 

const app = new Elysia()
.mount(auth.handler) 

  .use(cron({
    name: "cleanup-expired-otps",
    pattern: "0 */6 * * *", 
    run: () => otpService.cleanupExpiredOTPs()
  }))

  .use(
    openapi({
      path: "/docs",
      documentation: {
        info: {
          title: "API de Doações Gamificadas",
          version: "1.0.0",
          description: "Plataforma de caridade com sistema de XP e causas verificadas."
        },
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths()
      },
    })
  )
  .use(causeController)
  .use(userController)
  .use(donationController)
  .use(otpController)


  .listen(3000);

console.log(
  `querido rodando http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `doc em http://${app.server?.hostname}:${app.server?.port}/docs`
);
