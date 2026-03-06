import { t } from "elysia";

export const CreateWithdrawalSchema = t.Object({
  causeId: t.String(),
  amount:  t.Number({ minimum: 1, description: "Valor em R$ a sacar" }),
  pixKey:  t.String({ minLength: 3, description: "Chave PIX do destinatário (CPF, e-mail, telefone ou chave aleatória)" }),
});

export const WithdrawalParamsSchema = t.Object({
  id: t.String(),
});

export type CreateWithdrawalDTO = typeof CreateWithdrawalSchema.Type;
