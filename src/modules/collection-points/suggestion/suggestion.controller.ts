import Elysia from 'elysia';
import { betterAuthMiddleware } from '../../../middleware/auth';
import { container } from '../../../container';
import { NotFoundError } from '../../../errors/error-classes';
import { ErrorCodes } from '../../../errors/error-codes';
import {
  CreateSuggestionSchema,
  ReviewSuggestionSchema,
  SuggestionParamsSchema,
  MySuggestionsQuerySchema,
  PendingSuggestionsQuerySchema,
} from './suggestion.schema';

const { suggestionService, storageService } = container;

export const suggestionController = new Elysia({ prefix: '/collection-points/suggestions' })

  .use(betterAuthMiddleware)

  // ─────────────────────────────────────────────────────────────────────────
  // Rotas do USUÁRIO autenticado
  // ─────────────────────────────────────────────────────────────────────────

  .post(
    '/',
    async ({ body, user }) => {
      // Faz upload das imagens (se houver)
      const imageKeys =
        body.images && body.images.length > 0
          ? await storageService.uploadSuggestionImages(body.images)
          : [];

      // Parse do array de itens aceitos (vem como JSON string em multipart)
      const suggestedItems: string[] = JSON.parse(body.suggestedItems);

      return suggestionService.create(
        {
          name: body.name,
          street: body.street,
          number: body.number,
          complement: body.complement,
          neighborhood: body.neighborhood,
          city: body.city,
          state: body.state,
          zipCode: body.zipCode,
          country: body.country,
          latitude: Number(body.latitude),
          longitude: Number(body.longitude),
          suggestedItems,
          reason: body.reason,
        },
        user.id,
        imageKeys,
      );
    },
    {
      auth: true,
      body: CreateSuggestionSchema,
      detail: {
        tags: ['Collection Points', 'Suggestions'],
        summary: 'Sugerir um novo ponto de coleta',
        description: [
          'Permite que um usuário autenticado sugira um novo ponto de coleta.',
          '',
          'A sugestão entra com status **PENDING** e será analisada por um administrador.',
          '',
          '**Campos obrigatórios**: `name`, `street`, `number`, `city`, `state`, `latitude`, `longitude`, `suggestedItems`.',
          '',
          '**Imagens**: Até 5 fotos podem ser anexadas (ex: foto da fachada do local).',
          '',
          '**`suggestedItems`**: Enviado como JSON string. Exemplo: `\'["Roupas","Alimentos","Brinquedos"]\'`.',
          '',
          '**Exemplo (multipart/form-data)**:',
          '```',
          'name: "Associação Comunitária São José"',
          'street: "Rua das Flores"',
          'number: "123"',
          'city: "Lorena"',
          'state: "SP"',
          'latitude: -22.7261',
          'longitude: -45.1227',
          'suggestedItems: \'["Roupas","Alimentos"]\'',
          'reason: "Fica na praça central, muito movimentado"',
          'images: [arquivo1.jpg, arquivo2.jpg]',
          '```',
        ].join('\n'),
      },
    },
  )

  .get(
    '/mine',
    async ({ user, query }) => {
      return suggestionService.getMySuggestions(
        user.id,
        query.skip ? Number(query.skip) : undefined,
        query.take ? Number(query.take) : undefined,
      );
    },
    {
      auth: true,
      query: MySuggestionsQuerySchema,
      detail: {
        tags: ['Collection Points', 'Suggestions'],
        summary: 'Listar minhas sugestões de pontos de coleta',
        description: [
          'Retorna todas as sugestões enviadas pelo usuário autenticado, ordenadas da mais recente para a mais antiga.',
          '',
          'Cada sugestão inclui o status atual (`PENDING`, `APPROVED` ou `REJECTED`) e a nota do admin (se já analisada).',
        ].join('\n'),
      },
    },
  )

  .get(
    '/:id',
    async ({ params, user }) => {
      const suggestion = await suggestionService.getById(params.id);

      if (!suggestion) {
        throw new NotFoundError('Sugestão não encontrada', ErrorCodes.SUGGESTION_NOT_FOUND);
      }

      // Apenas o autor ou admins podem ver detalhes
      if (suggestion.user.id !== user.id && !user.isAdmin) {
        throw new NotFoundError('Sugestão não encontrada', ErrorCodes.SUGGESTION_NOT_FOUND);
      }

      return suggestion;
    },
    {
      auth: true,
      params: SuggestionParamsSchema,
      detail: {
        tags: ['Collection Points', 'Suggestions'],
        summary: 'Ver detalhes de uma sugestão',
        description:
          'Retorna os detalhes completos de uma sugestão. Acessível pelo autor da sugestão ou por administradores.',
      },
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Rotas ADMIN
  // ─────────────────────────────────────────────────────────────────────────

  .get(
    '/admin/pending',
    async ({ user, query }) => {
      return suggestionService.getPending(
        query.skip ? Number(query.skip) : undefined,
        query.take ? Number(query.take) : undefined,
      );
    },
    {
      isAdmin: true,
      query: PendingSuggestionsQuerySchema,
      detail: {
        tags: ['Collection Points', 'Suggestions', 'Admin'],
        summary: 'Listar sugestões pendentes de análise (admin)',
        description: [
          'Retorna todas as sugestões com status `PENDING`, aguardando análise do administrador.',
          '',
          'A resposta inclui o campo `total` com o número total de sugestões pendentes para controle de paginação.',
          '',
          'Inclui dados do usuário que sugeriu, imagens anexadas e itens sugeridos.',
        ].join('\n'),
      },
    },
  )

  .patch(
    '/admin/:id/review',
    async ({ params, body, user }) => {
      return suggestionService.review(params.id, {
        status: body.status,
        adminNote: body.adminNote,
      });
    },
    {
      isAdmin: true,
      params: SuggestionParamsSchema,
      body: ReviewSuggestionSchema,
      detail: {
        tags: ['Collection Points', 'Suggestions', 'Admin'],
        summary: 'Aprovar ou rejeitar sugestão de ponto de coleta (admin)',
        description: [
          'Permite ao administrador aprovar ou rejeitar uma sugestão pendente.',
          '',
          '**Se `APPROVED`**:',
          '- Um novo **CollectionPoint** é criado automaticamente com os dados da sugestão.',
          '- A sugestão recebe a referência (`approvedPointId`) ao ponto criado.',
          '- O usuário é notificado por email.',
          '',
          '**Se `REJECTED`**:',
          '- A sugestão é marcada como rejeitada.',
          '- O campo `adminNote` é recomendado para informar o motivo ao usuário.',
          '- O usuário é notificado por email com o motivo.',
          '',
          '**Exemplo (aprovação)**:',
          '```json',
          '{',
          '  "status": "APPROVED",',
          '  "adminNote": "Local verificado, ponto de coleta aprovado!"',
          '}',
          '```',
          '',
          '**Exemplo (rejeição)**:',
          '```json',
          '{',
          '  "status": "REJECTED",',
          '  "adminNote": "Endereço não encontrado no Google Maps."',
          '}',
          '```',
        ].join('\n'),
      },
    },
  );
