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

export const CollectionPointParamsSchema = t.Object({
  id: t.String(),
});

export type CreateCollectionPointDTO = typeof CreateCollectionPointSchema.Type;
export type UpdateCollectionPointDTO = typeof UpdateCollectionPointSchema.Type;
export type CollectionPointParams = typeof CollectionPointParamsSchema.Type;
