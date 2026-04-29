import { Queue, Worker, Job } from "bullmq";
import { createBullMqConnection } from "../lib/bullmq";
import type { IMailer } from "../lib/mailer";

const REDIS_CONNECTION = createBullMqConnection();

console.log("[EmailQueue] Redis host:", REDIS_CONNECTION.host, "port:", REDIS_CONNECTION.port);

type DonationParams = Parameters<IMailer["sendDonationConfirmationEmail"]>[1];
type PaymentFailedParams = Parameters<IMailer["sendPaymentFailedEmail"]>[1];

export type EmailJobData =
    | { type: "DONATION_CONFIRMATION"; to: string; params: DonationParams }
    | { type: "PAYMENT_FAILED"; to: string; params: PaymentFailedParams }
    | { type: "OTP"; to: string; otp: string; userName: string }
    | { type: "CAUSE_APPROVAL"; to: string; causeTitle: string };

export class EmailQueueService {
    private readonly queue: Queue<EmailJobData>;
    private readonly worker: Worker<EmailJobData>;

    constructor(private readonly mailer: IMailer) {

        this.queue = new Queue("email-queue", {
            connection: REDIS_CONNECTION,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: "exponential", delay: 2000 },
                removeOnComplete: true,
                removeOnFail: false,
            }
        });

        this.worker = new Worker<EmailJobData>(
            "email-queue",
            this.processJob.bind(this),
            { connection: REDIS_CONNECTION }
        );

        this.setupListeners();
    }

    private async processJob(job: Job<EmailJobData>): Promise<void> {
        const { type, to } = job.data;
        console.log(`[EmailQueue] 📧 Processando envio de email: ${type} para ${to}`);

        switch (job.data.type) {
            case "DONATION_CONFIRMATION":
                await this.mailer.sendDonationConfirmationEmail(to, job.data.params);
                break;
            case "PAYMENT_FAILED":
                await this.mailer.sendPaymentFailedEmail(to, job.data.params);
                break;
            case "OTP":
                await this.mailer.sendOTPEmail(to, job.data.otp, job.data.userName);
                break;
            case "CAUSE_APPROVAL":
                await this.mailer.sendCauseApprovalEmail(to, job.data.causeTitle);
                break;    
        }
    }

    private setupListeners() {
        this.worker.on("completed", (job) => {
            console.log(`[EmailQueue]  Email do job ${job.id} enviado com sucesso!`);
        });

        this.worker.on("failed", (job, err) => {
            console.error(`[EmailQueue]  Falha no job ${job?.id}:`, err.message);
        });

        this.worker.on("error", (err) => {
            console.error(`[EmailQueue]  Erro no worker:`, err.message);
        });
    }

    async enqueueDonationConfirmation(to: string, params: DonationParams): Promise<void> {
        await this.queue.add("donation-confirmation", { type: "DONATION_CONFIRMATION", to, params })
            .catch(err => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    async enqueueResetPassword(to: string, otp: string, userName: string): Promise<void> {
        await this.queue.add("reset-password", { type: "OTP", to, otp, userName })
            .catch(err => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    async enqueuePaymentFailed(to: string, params: PaymentFailedParams): Promise<void> {
        await this.queue.add("payment-failed", { type: "PAYMENT_FAILED", to, params })
            .catch(err => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    async enqueueOtp(to: string, otp: string, userName: string): Promise<void> {
        console.log(`[EmailQueue] Enfileirando email OTP para ${to} com OTP: ${otp}`);
        await this.queue.add("otp", { type: "OTP", to, otp, userName })
            .catch(err => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    async enqueueCauseApproval(to: string, causeTitle: string): Promise<void> {
        console.log(`[EmailQueue] Enfileirando email de aprovação de causa para ${to} sobre a causa: ${causeTitle}`);
        await this.queue.add("cause-approval", { type: "CAUSE_APPROVAL", to, causeTitle })
            .catch(err => console.error("[EmailQueue] Erro ao enfileirar email:", err.message));
    }

    async shutdown(): Promise<void> {
        await this.worker.close();
        await this.queue.close();
    }
}