import Elysia, { t } from 'elysia';
import { betterAuthMiddleware } from '../../middleware/auth';
import { container } from '../../container';
import { NotFoundError } from '../../errors/error-classes';
import { ErrorCodes } from '../../errors/error-codes';
import {
  CreateCollectionPointSchema,
  UpdateCollectionPointSchema,
  CollectionPointParamsSchema,
} from './collection-points.schema';

const { collectionPointService } = container;

export const collectionPointController = new Elysia({ prefix: '/collection-points' })

  .use(betterAuthMiddleware)

  .get(
    '/',
    async ({ query }) => {
      return collectionPointService.getActive(
        Number(query.skip) || 0,
        Number(query.take) || 20,
      );
    },
    {
      query: t.Object({
        skip: t.Optional(t.Numeric()),
        take: t.Optional(t.Numeric()),
      }),
      detail: { tags: ['Collection Points'], summary: 'Listar pontos de coleta ativos (público)' },
    },
  )

  .get(
    '/:id',
    async ({ params }) => {
      const point = await collectionPointService.getById(params.id);
      if (!point) {
        throw new NotFoundError('Ponto de coleta não encontrado', ErrorCodes.COLLECTION_POINT_NOT_FOUND);
      }
      return point;
    },
    {
      params: CollectionPointParamsSchema,
      detail: { tags: ['Collection Points'], summary: 'Buscar ponto de coleta por ID (público)' },
    },
  )

  .get(
    '/admin/all',
    async ({ query }) => {
      return collectionPointService.getAll(
        Number(query.skip) || 0,
        Number(query.take) || 20,
      );
    },
    {
      isAdmin: true,
      query: t.Object({
        skip: t.Optional(t.Numeric()),
        take: t.Optional(t.Numeric()),
      }),
      detail: { tags: ['Collection Points'], summary: 'Listar TODOS os pontos de coleta (admin)' },
    },
  )

  .post(
    '/',
    async ({ body }) => {
      return collectionPointService.create(body);
    },
    {
      isAdmin: true,
      body: CreateCollectionPointSchema,
      detail: { tags: ['Collection Points'], summary: 'Criar ponto de coleta (admin)' },
    },
  )

  .patch(
    '/:id',
    async ({ params, body }) => {
      return collectionPointService.update(params.id, body);
    },
    {
      isAdmin: true,
      params: CollectionPointParamsSchema,
      body: UpdateCollectionPointSchema,
      detail: { tags: ['Collection Points'], summary: 'Atualizar ponto de coleta (admin)' },
    },
  )

  .delete(
    '/:id',
    async ({ params }) => {
      return collectionPointService.delete(params.id);
    },
    {
      isAdmin: true,
      params: CollectionPointParamsSchema,
      detail: { tags: ['Collection Points'], summary: 'Deletar ponto de coleta (admin)' },
    },
  );
