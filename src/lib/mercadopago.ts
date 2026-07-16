import { MercadoPagoConfig, Payment } from "mercadopago";
import { ExternalServiceError } from "../errors/error-classes";
import { ErrorCodes } from "../errors/error-codes";

export interface IPaymentGateway {
  transfer(params: {
    amount: number;
    pixKey: string;
    description: string;
    idempotencyKey: string;
  }): Promise<{ transferId: string }>;
}

export class MercadoPagoPaymentGateway implements IPaymentGateway {
  private readonly paymentClient: Payment;
  private readonly accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken ?? process.env.MERCADOPAGO_ACCESS_TOKEN!;
    
    if (!this.accessToken) {
      throw new ExternalServiceError(
        "Mercado Pago não configurado",
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
        { missing: "MERCADOPAGO_ACCESS_TOKEN" }
      );
    }

    const mpConfig = new MercadoPagoConfig({
      accessToken: this.accessToken,
      options: { timeout: 5000 },
    });

    this.paymentClient = new Payment(mpConfig);
  }

  async transfer(params: {
    amount: number;
    pixKey: string;
    description: string;
    idempotencyKey: string;
  }): Promise<{ transferId: string }> {
    const response = await fetch("https://api.mercadopago.com/v1/transfers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": params.idempotencyKey,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency_id: "BRL",
        description: params.description,
        receiver: {
          type: "bank_account",
          wallet_address: params.pixKey,
        },
      }),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      const msg = data?.message ?? data?.error ?? `MP transfer falhou (status ${response.status})`;
      throw new ExternalServiceError(
        msg,
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
        { provider: "mercadopago", status: response.status }
      );
    }

    return { transferId: String(data.id) };
  }

  // Método público para acesso ao cliente Mercado Pago (compatibilidade)
  getPaymentClient(): Payment {
    return this.paymentClient;
  }
}

// Singleton padrão (compatibilidade com código existente)
let gateway: MercadoPagoPaymentGateway | null = null;

export function getPaymentGateway(): IPaymentGateway {
  if (!gateway) gateway = new MercadoPagoPaymentGateway();
  return gateway;
}

export function setPaymentGateway(next: MercadoPagoPaymentGateway | null): void {
  gateway = next;
}

// Exports para compatibilidade
export const mpPaymentClient = new Payment(
  new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    options: { timeout: 5000 },
  })
);

export async function mpTransfer(params: {
  amount: number;
  pixKey: string;
  description: string;
  idempotencyKey: string;
}): Promise<{ transferId: string }> {
  return getPaymentGateway().transfer(params);
}
