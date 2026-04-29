import { PrismaClient, WithdrawalStatus } from "../../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

export class WithdrawalApprovalJob {
    
    private timer: Timer | null = null;
    private running = false;

    constructor(private readonly db: PrismaClient = prisma) {}

    start(intervalMs: number = 60 * 60 * 1000): void {
        if (this.timer) {
            return;
        }

        void this.run();
        this.timer = setInterval(() => {
            void this.run();
        }, intervalMs);

        console.log("[WithdrawalApprovalJob] agendado para rodar a cada 1 hora");
    }

    async run(): Promise<number> {
        if (this.running) {
            return 0;
        }

        this.running = true;

        try {
            const result = await this.db.withdrawal.updateMany({
                where: { status: WithdrawalStatus.PENDING },
                data: { status: WithdrawalStatus.COMPLETED },
            });

            if (result.count > 0) {
                console.log(`[WithdrawalApprovalJob] ${result.count} saque(s) aprovados automaticamente`);
            }

            return result.count;
        } finally {
            this.running = false;
        }
    }

    stop(): void {
        if (!this.timer) {
            return;
        }

        clearInterval(this.timer);
        this.timer = null;
    }
}

export const withdrawalApprovalJob = new WithdrawalApprovalJob();




