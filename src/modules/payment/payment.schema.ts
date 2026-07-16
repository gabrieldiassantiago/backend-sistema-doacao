import { t } from "elysia";

export const InitiatePaymentSchema = t.Object({
  causeId: t.String(),
  amount:  t.Number({ minimum: 1, description: "Valor em R$" }),
  message: t.Optional(t.String({ maxLength: 500 })),
  isAnonymous: t.Optional(t.Boolean()),
});

export const WebhookSchema = t.Any();

export type InitiatePaymentDTO = typeof InitiatePaymentSchema.Type;
