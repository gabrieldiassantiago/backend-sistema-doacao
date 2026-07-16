import { t } from 'elysia';

/**
 * Body para criação de sugestão de ponto de coleta.
 *
 * O campo `images` aceita até 5 fotos (ex: fachada do local).
 * `suggestedItems` é enviado como JSON string em requests multipart.
 */
export const CreateSuggestionSchema = t.Object({
  name: t.String({ minLength: 1, description: 'Nome do ponto de coleta sugerido.' }),
  street: t.String({ minLength: 1, description: 'Rua / logradouro.' }),
  number: t.String({ minLength: 1, description: 'Número.' }),
  complement: t.Optional(t.String({ description: 'Complemento (sala, bloco, etc.).' })),
  neighborhood: t.Optional(t.String({ description: 'Bairro.' })),
  city: t.String({ minLength: 1, description: 'Cidade.' }),
  state: t.String({ minLength: 1, description: 'Estado (UF).' }),
  zipCode: t.Optional(t.String({ description: 'CEP.' })),
  country: t.Optional(t.String({ description: 'País (padrão: Brasil).' })),
  latitude: t.Numeric({ minimum: -90, maximum: 90, description: 'Latitude do local.' }),
  longitude: t.Numeric({ minimum: -180, maximum: 180, description: 'Longitude do local.' }),
  suggestedItems: t.String({
    description:
      'JSON array com nomes dos itens aceitos. Ex: \'["Roupas","Alimentos"]\'. Enviado como string em multipart.',
  }),
  reason: t.Optional(
    t.String({
      description: 'Justificativa/motivo da sugestão. Ex: "É um local muito movimentado".',
    }),
  ),
  images: t.Optional(
    t.Files({
      maxItems: 5,
      description: 'Fotos do local (ex: fachada). Até 5 imagens.',
    }),
  ),
});

/**
 * Body de revisão (admin aprova ou rejeita).
 */
export const ReviewSuggestionSchema = t.Object({
  status: t.Union([t.Literal('APPROVED'), t.Literal('REJECTED')], {
    description: 'Decisão: APPROVED ou REJECTED.',
  }),
  adminNote: t.Optional(
    t.String({ description: 'Nota do admin (motivo da aprovação/rejeição).' }),
  ),
});

/**
 * Params com :id da sugestão.
 */
export const SuggestionParamsSchema = t.Object({
  id: t.String({ description: 'ID da sugestão.' }),
});

/**
 * Query params para listagem de sugestões do usuário.
 */
export const MySuggestionsQuerySchema = t.Object({
  skip: t.Optional(t.Numeric({ description: 'Paginação: registros a pular.' })),
  take: t.Optional(t.Numeric({ description: 'Paginação: máximo de registros.' })),
});

/**
 * Query params para listagem de sugestões pendentes (admin).
 */
export const PendingSuggestionsQuerySchema = t.Object({
  skip: t.Optional(t.Numeric({ description: 'Paginação: registros a pular.' })),
  take: t.Optional(t.Numeric({ description: 'Paginação: máximo de registros.' })),
});

// ── Tipos inferidos ──────────────────────────────────────────────────────────

export type CreateSuggestionDTO = typeof CreateSuggestionSchema.static;
export type ReviewSuggestionDTO = typeof ReviewSuggestionSchema.static;
export type SuggestionParams = typeof SuggestionParamsSchema.static;
