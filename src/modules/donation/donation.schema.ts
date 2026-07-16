import { t } from "elysia";

export const CreateDonationSchema = t.Object({
  amount:  t.Number({ minimum: 1, description: "Valor em R$" }),
  causeId: t.String(),
  message: t.Optional(t.String({ maxLength: 500 })),
  isAnonymous: t.Optional(t.Boolean()),
});

export const DonationParamsSchema = t.Object({
  id: t.String(),
});

export type CreateDonationDTO = typeof CreateDonationSchema.Type;
export type DonationParams    = typeof DonationParamsSchema.Type;
