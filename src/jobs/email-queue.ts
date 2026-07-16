import { Queue, Worker, Job } from "bullmq";
import { createBullMqConnection } from "../lib/bullmq";
import type { IMailer } from "../lib/mailer";

const REDIS_CONNECTION = createBullMqConnection();

type DonationParams = Parameters<IMailer["sendDonationConfirmationEmail"]>[1];
type PaymentFailedParams = Parameters<IMailer["sendPaymentFailedEmail"]>[1];
type CauseUnderReviewParams = Parameters<IMailer["sendCauseUnderReviewEmail"]>[1];
type CauseApprovalParams = Parameters<IMailer["sendCauseApprovalEmail"]>[1];
type SuggestionReviewedParams = Parameters<IMailer["sendSuggestionReviewedEmail"]>[1];

export type EmailJobData =
    | { type: "DONATION_CONFIRMATION"; to: string; params: DonationParams }
    | { type: "PAYMENT_FAILED"; to: string; params: PaymentFailedParams }
    | { type: "CAUSE_UNDER_REVIEW"; to: string; params: CauseUnderReviewParams }
    | { type: "OTP"; to: string; otp: string; userName: string }
    | { type: "CAUSE_APPROVAL"; to: string; params: CauseApprovalParams }
    | { type: "SUGGESTION_REVIEWED"; to: string; params: SuggestionReviewedParams };

export class EmailQueueService {
    private readonly queue: Queue<EmailJobData>;
    private worker?: Worker<EmailJobData>;

    constructor(private readonly mailer: IMailer) {
    
        this.queue = new Queue("email-queue", {
            connection: REDIS_CONNECTION,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: "exponential", delay: 2000 },
                removeOnComplete: true,
                removeOnFail: false,
            },
        });
    }

    startWorker(): void {

        if (this.worker) {
            console.warn("[EmailQueue] Worker já está rodando, ignorando startWorker()");
            return;
        }

        console.log(
            "[EmailQueue] Iniciando worker. Redis host:",
            REDIS_CONNECTION.host,
            "port:",
            REDIS_CONNECTION.port,
        );

        this.worker = new Worker<EmailJobData>(
            "email-queue",
            this.processJob.bind(this),
            { 
                connection: REDIS_CONNECTION,
                concurrency: 5, // Processar até 5 emails em paralelo
                stalledInterval: 60000, // Aumenta o intervalo de checagem de jobs parados para 60s
             },
        );

        this.setupListeners(this.worker);
    }

    isWorkerRunning(): boolean {
        return this.worker !== undefined;
    }

    private async processJob(job: Job<EmailJobData>): Promise<void> {
        const { type, to } = job.data;
        console.log(`[EmailQueue] Processando envio de email: ${type} para ${to}`);

        switch (job.data.type) {
            case "DONATION_CONFIRMATION":
                await this.mailer.sendDonationConfirmationEmail(to, job.data.params);
                break;
            case "PAYMENT_FAILED":
                await this.mailer.sendPaymentFailedEmail(to, job.data.params);
                break;
            case "CAUSE_UNDER_REVIEW":
                await this.mailer.sendCauseUnderReviewEmail(to, job.data.params);
                break;
            case "OTP":
                await this.mailer.sendOTPEmail(to, job.data.otp, job.data.userName);
                break;
            case "CAUSE_APPROVAL":
                await this.mailer.sendCauseApprovalEmail(to, job.data.params);
                break;
            case "SUGGESTION_REVIEWED":
                await this.mailer.sendSuggestionReviewedEmail(to, job.data.params);
                break;
        }
    }

    private setupListeners(worker: Worker<EmailJobData>): void {
        worker.on("completed", (job) => {
            console.log(`[EmailQueue] Email do job ${job.id} enviado com sucesso!`);
        });

        worker.on("failed", (job, err) => {
            console.error(`[EmailQueue] Falha no job ${job?.id}:`, err.message);
        });

        worker.on("error", (err) => {
            console.error(`[EmailQueue] Erro no worker:`, err.message);
        });
    }

    async enqueueDonationConfirmation(to: string, params: DonationParams): Promise<void> {
        await this.queue
            .add("donation-confirmation", { type: "DONATION_CONFIRMATION", to, params })
            .catch((err) => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    async enqueueResetPassword(to: string, otp: string, userName: string): Promise<void> {
        await this.queue
            .add("reset-password", { type: "OTP", to, otp, userName })
            .catch((err) => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    async enqueuePaymentFailed(to: string, params: PaymentFailedParams): Promise<void> {
        await this.queue
            .add("payment-failed", { type: "PAYMENT_FAILED", to, params })
            .catch((err) => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    async enqueueCauseUnderReview(to: string, params: CauseUnderReviewParams): Promise<void> {
        console.log(
            `[EmailQueue] Enfileirando email de causa em análise para ${to} sobre a causa: ${params.causeTitle}`,
        );
        await this.queue
            .add("cause-under-review", { type: "CAUSE_UNDER_REVIEW", to, params })
            .catch((err) => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    async enqueueOtp(to: string, otp: string, userName: string): Promise<void> {
        console.log(`[EmailQueue] Enfileirando email OTP para ${to}`);
        await this.queue
            .add("otp", { type: "OTP", to, otp, userName })
            .catch((err) => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    async enqueueCauseApproval(to: string, params: CauseApprovalParams): Promise<void> {
        console.log(
            `[EmailQueue] Enfileirando email de aprovação de causa para ${to} sobre a causa: ${params.causeTitle}`,
        );
        await this.queue
            .add("cause-approval", { type: "CAUSE_APPROVAL", to, params })
            .catch((err) => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    async enqueueSuggestionReviewed(to: string, params: SuggestionReviewedParams): Promise<void> {
        console.log(
            `[EmailQueue] Enfileirando email de sugestão analisada para ${to} sobre o ponto: ${params.pointName}`,
        );
        await this.queue
            .add("suggestion-reviewed", { type: "SUGGESTION_REVIEWED", to, params })
            .catch((err) => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    /**
     * Fecha conexões de forma graciosa.
     * Deve ser chamado no shutdown do processo (SIGTERM/SIGINT).
     */
    async shutdown(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            this.worker = undefined;
        }
        
        await this.queue.close();
    }
}
