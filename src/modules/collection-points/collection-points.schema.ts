import { t } from 'elysia';

export const CreateCollectionPointSchema = t.Object({
  name: t.String({ minLength: 1 }),
  street: t.String({ minLength: 1 }),
  number: t.String({ minLength: 1 }),
  complement: t.Optional(t.String()),
  neighborhood: t.Optional(t.String()),
  city: t.String({ minLength: 1 }),
  state: t.String({ minLength: 1 }),
  zipCode: t.Optional(t.String()),
  country: t.Optional(t.String()),
  latitude: t.Number({ minimum: -90, maximum: 90 }),
  longitude: t.Number({ minimum: -180, maximum: 180 }),
  acceptedItems: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
});

export const UpdateCollectionPointSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  street: t.Optional(t.String({ minLength: 1 })),
  number: t.Optional(t.String({ minLength: 1 })),
  complement: t.Optional(t.String()),
  neighborhood: t.Optional(t.String()),
  city: t.Optional(t.String({ minLength: 1 })),
  state: t.Optional(t.String({ minLength: 1 })),
  zipCode: t.Optional(t.String()),
  country: t.Optional(t.String()),
  // Geolocalização
  latitude: t.Optional(t.Number({ minimum: -90, maximum: 90 })),
  longitude: t.Optional(t.Number({ minimum: -180, maximum: 180 })),
  // Itens aceitos
  acceptedItems: t.Optional(t.Array(t.String({ minLength: 1 }))),
  isActive: t.Optional(t.Boolean()),
});

/**
 * Query params aceitos pelo GET /collection-points.
 *
 * Filtros de ordenação:
 *  - `recent`  → mais recentes primeiro (padrão)
 *  - `nearest` → mais próximos do usuário (requer `lat` e `lng`)
 *
 * Filtro por localização:
 *  - `city` / `state`   → texto parcial, case-insensitive
 *  - `lat` + `lng`      → coordenadas do usuário (usadas com sort=nearest)
 *  - `radius`           → raio máximo em km (padrão 50, máx 500)
 *
 * Busca:
 *  - `search`           → busca por nome do ponto ou nome de item aceito
 */
export const GetCollectionPointsQuerySchema = t.Object({
  skip: t.Optional(t.Numeric({ description: 'Número de registros a pular (paginação).' })),
  take: t.Optional(t.Numeric({ description: 'Número máximo de registros a retornar.' })),
  sort: t.Optional(
    t.Union(
      [t.Literal('recent'), t.Literal('nearest')],
      { description: 'Critério de ordenação. `nearest` requer lat e lng.' },
    ),
  ),
  city: t.Optional(t.String({ description: 'Filtrar por cidade (parcial, case-insensitive).' })),
  state: t.Optional(t.String({ description: 'Filtrar por estado (parcial, case-insensitive).' })),
  lat: t.Optional(
    t.Numeric({
      minimum: -90,
      maximum: 90,
      description: 'Latitude do usuário. Obrigatório com sort=nearest.',
    }),
  ),
  lng: t.Optional(
    t.Numeric({
      minimum: -180,
      maximum: 180,
      description: 'Longitude do usuário. Obrigatório com sort=nearest.',
    }),
  ),
  radius: t.Optional(
    t.Numeric({
      minimum: 1,
      maximum: 500,
      description: 'Raio máximo de busca em km quando sort=nearest (padrão: 50).',
    }),
  ),
  search: t.Optional(t.String({ description: 'Buscar por nome do ponto ou item aceito.' })),
});

export const CollectionPointParamsSchema = t.Object({
  id: t.String(),
});

export type CreateCollectionPointDTO = typeof CreateCollectionPointSchema.Type;
export type UpdateCollectionPointDTO = typeof UpdateCollectionPointSchema.Type;
export type CollectionPointParams = typeof CollectionPointParamsSchema.Type;
export type GetCollectionPointsQuery = typeof GetCollectionPointsQuerySchema.Type;
