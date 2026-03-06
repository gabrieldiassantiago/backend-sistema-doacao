import { MercadoPagoConfig, Payment } from "mercadopago";

const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export const mpPaymentClient = new Payment(mpConfig);

export async function mpTransfer(params: {
  amount:         number;
  pixKey:         string;
  description:    string;
  idempotencyKey: string;
}): Promise<{ transferId: string }> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  const response = await fetch("https://api.mercadopago.com/v1/transfers", {
    method: "POST",
    headers: {
      Authorization:      `Bearer ${token}`,
      "Content-Type":     "application/json",
      "X-Idempotency-Key": params.idempotencyKey,
    },
    body: JSON.stringify({
      amount:      params.amount,
      currency_id: "BRL",
      description: params.description,
      receiver: {
        type:           "bank_account",
        wallet_address: params.pixKey,
      },
    }),
  });

  const data = await response.json() as any;

  if (!response.ok) {
    const msg = data?.message ?? data?.error ?? `MP transfer falhou (status ${response.status})`;
    throw new Error(msg);
  }

  return { transferId: String(data.id) };
}
