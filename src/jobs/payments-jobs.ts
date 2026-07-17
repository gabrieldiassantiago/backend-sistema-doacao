import { cron } from '@elysiajs/cron';
import { prisma } from '../lib/prisma';
import { container } from '../container';

export const checkPendingPayments = async () => {
    console.log('[CRON] Iniciando verificação de pagamentos pendentes...');

    try {

        const pendingPayments = await prisma.payment.findMany({
            where: {
                status: 'PENDING',
                emailSent: false
            },
            include: {
                user: true,
                cause: true
            }
        });

        if (pendingPayments.length === 0) {
            console.log('[CRON] Nenhum pagamento pendente para alertar.');
            return;
        }

        for (const payment of pendingPayments) {
            try {
                if (!payment.mpPaymentId) continue;

                // O status é sempre confirmado no provedor. Um PIX que apenas
                // continua pendente não deve gerar um falso e-mail de falha.
                await container.paymentService.handleWebhook({
                    type: 'payment',
                    data: { id: payment.mpPaymentId },
                });
            } catch (emailError) {
                // Se falhar o envio para um, logamos o erro mas continuamos o loop para os outros
                console.error(`❌ Erro ao reconciliar pagamento ${payment.id}:`, emailError);
            }
        }

        console.log('✅ [CRON] Verificação de pagamentos concluída.');
    } catch (error) {
        console.error('❌ [CRON] Falha geral no job de pagamentos:', error);
    }
};

export const paymentJobs = cron({
    name: 'check-pending-payments',
    pattern: '*/5 * * * *', // Roda a cada 5 minutos
    run: checkPendingPayments
});
