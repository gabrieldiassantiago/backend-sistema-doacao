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
import { suggestionController } from "./modules/collection-points/suggestion/suggestion.controller";
import { withdrawalApprovalJob } from "./modules/withdrawal/jobs/withdrawal.job";
import logixlysia from "logixlysia";
import { errorHandler } from "./plugins/error-handler";
import { container } from "./container";
import { paymentJobs, checkPendingPayments } from "./jobs/payments-jobs";

export class AppBootstrapper {
  private app: any;

  async bootstrap(): Promise<void> {
    const docsUser = process.env.DOCS_USERNAME;
    const docsPassword = process.env.DOCS_PASSWORD;
    const webhookUrl = process.env.MERCADO_PAGO_WEBHOOK_URL;

    if (!docsUser || !docsPassword || !webhookUrl) {
      throw new Error(
        "DOCS_USERNAME, DOCS_PASSWORD e MERCADO_PAGO_WEBHOOK_URL devem ser configuradas",
      );
    }

    this.app = new Elysia()

      .use(cors({
        origin: [
          "https://doacao-frontend-swart.vercel.app",
          "http://localhost:3001",
          "https://doacao-frontend-amber.vercel.app"
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
      }))

      .use(paymentJobs)


      .use(errorHandler)
      .mount(auth.handler)


      .onBeforeHandle(({ request, set, path }) => {
        if (!path.startsWith("/docs")) return;

        const authHeader = request.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Basic ")) {
          set.status = 401;
          set.headers["WWW-Authenticate"] = 'Basic realm="Docs Privadas"';
          return "Acesso não autorizado";
        }

        const base64 = authHeader.split(" ")[1];
        const decoded = Buffer.from(base64, "base64").toString("utf-8");
        const [username, password] = decoded.split(":");

        if (username !== docsUser || password !== docsPassword) {
          set.status = 401;
          set.headers["WWW-Authenticate"] = 'Basic realm="Docs Privadas"';
          return "Usuário ou senha inválidos";
        }
      })

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

      .use(logixlysia({
        config: {
          showStartupMessage: true,
          startupMessageFormat: "banner",
          pino: {
            level: "info",
            redact: ["password", "token", "apiKey", "creditCard"],
            base: {
              service: "my-api",
              version: process.env.APP_VERSION,
              environment: "production"
            }
          }
        }
      }))

      .use(causeController)
      .use(categoryController)
      .use(userController)
      .use(donationController)
      .use(paymentController)
      .use(withdrawalController)
      .use(collectionPointController)
      .use(suggestionController);
  }

  async start(port: number = 3000): Promise<void> {
    await this.bootstrap();
    this.app.listen(port);
    //withdrawalApprovalJob.start();

    container.emailQueueService.startWorker();

    // Roda a verificação de pagamentos imediatamente no start
    void checkPendingPayments();

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

const bootstrapper = new AppBootstrapper();
await bootstrapper.start(3000);
