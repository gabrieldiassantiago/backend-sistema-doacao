import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { auth, OpenAPI } from "./auth";
import { causeController } from "./modules/cause/cause.controller";
import { categoryController } from "./modules/category/category.controller";
import { userController } from "./modules/user/user.controller";
import { donationController } from "./modules/donation/donation.controller";
import { paymentController } from "./modules/payment/payment.controller";
import { withdrawalController } from "./modules/withdrawal/withdrawal.controller";
import { collectionPointController } from "./modules/collection-points/collection-points.controller";
import { prisma } from "./lib/prisma";
import cron from "@elysiajs/cron";
import { errorHandler } from "./plugins/error-handler";

export class AppBootstrapper {
  private app: any;


  async bootstrap(): Promise<void> {
    this.app = new Elysia()
      .use(cors({
        origin: ['https://doacao-frontend-swart.vercel.app',
          'http://localhost:3001',],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
      }))

      .use(errorHandler)
      .mount(auth.handler)

      .use(
        openapi({
          path: "/docs",
          documentation: {
            info: {
              title: "API de Doações Gamificadas",
              version: "1.0.0",
              description: "Plataforma de caridade com sistema de XP e causas verificadas.",
            },
            components: await OpenAPI.components,
            paths: await OpenAPI.getPaths(),
          },
        })
      )
      .use(causeController)
      .use(categoryController)
      .use(userController)
      .use(donationController)
      .use(paymentController)
      .use(withdrawalController)
      .use(collectionPointController)
  }

  async start(port: number = 3000): Promise<void> {
    await this.bootstrap();
    this.app.listen(port);

    console.log(
      `Servidor rodando em: http://${this.app.server?.hostname}:${this.app.server?.port}`
    );
    console.log(
      `doc em http://${this.app.server?.hostname}:${this.app.server?.port}/docs`
    );
  }

  getApp(): any {
    return this.app;
  }
}

// Application entry point
const bootstrapper = new AppBootstrapper();
await bootstrapper.start(3000);
