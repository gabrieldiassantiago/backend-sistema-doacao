import { t } from "elysia";

export const InitiatePaymentSchema = t.Object({
  causeId: t.String(),
  amount:  t.Number({ minimum: 1, description: "Valor em R$" }),
  message: t.Optional(t.String({ maxLength: 500 })),
});

export const WebhookSchema = t.Any();

export type InitiatePaymentDTO = typeof InitiatePaymentSchema.Type;
