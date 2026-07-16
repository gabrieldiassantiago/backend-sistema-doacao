import type {
  ISuggestionRepository,
  ISuggestionService,
  CreateSuggestionData,
  ReviewSuggestionData,
  SuggestionWithImagesAndUser,
  SuggestionWithImageUrls,
} from './suggestion.types';
import type { ICollectionPointRepository } from '../colleciton-points.types';
import type { IUserRepository } from '../../user/user.types';
import type { S3StorageService } from '../../../lib/s3';
import type { EmailQueueService } from '../../../jobs/email-queue';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../../errors/error-classes';
import { ErrorCodes } from '../../../errors/error-codes';

export class SuggestionService implements ISuggestionService {
  constructor(
    private readonly suggestionRepository: ISuggestionRepository,
    private readonly collectionPointRepository: ICollectionPointRepository,
    private readonly userRepository: IUserRepository,
    private readonly storage: S3StorageService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private withImageUrls(suggestion: SuggestionWithImagesAndUser): SuggestionWithImageUrls {
    return {
      ...suggestion,
      images: suggestion.images.map((img) => ({
        ...img,
        url: this.storage.presignRead(img.key),
      })),
    };
  }



  private async getSuggestionOrThrow(id: string) {
    const suggestion = await this.suggestionRepository.findById(id);
    if (!suggestion) {
      throw new NotFoundError('Sugestão não encontrada', ErrorCodes.SUGGESTION_NOT_FOUND);
    }
    return suggestion;
  }

  // ── Métodos públicos ───────────────────────────────────────────────────────

  async create(
    data: CreateSuggestionData,
    userId: string,
    imageKeys: string[],
  ): Promise<SuggestionWithImageUrls> {
    const suggestion = await this.suggestionRepository.create(data, userId, imageKeys);
    return this.withImageUrls(suggestion);
  }

  async getById(id: string): Promise<SuggestionWithImageUrls | null> {
    const suggestion = await this.suggestionRepository.findById(id);
    if (!suggestion) return null;
    return this.withImageUrls(suggestion);
  }

  async getMySuggestions(
    userId: string,
    skip = 0,
    take = 20,
  ): Promise<SuggestionWithImageUrls[]> {
    const suggestions = await this.suggestionRepository.findByUserId(userId, skip, take);
    return suggestions.map((s) => this.withImageUrls(s));
  }

  async getPending(
    skip = 0,
    take = 20,
  ): Promise<{ suggestions: SuggestionWithImageUrls[]; total: number }> {

    const [suggestions, total] = await Promise.all([
      this.suggestionRepository.findByStatus('PENDING', skip, take),
      this.suggestionRepository.countByStatus('PENDING'),
    ]);

    return {
      suggestions: suggestions.map((s) => this.withImageUrls(s)),
      total,
    };
  }

  async review(
    id: string,
    data: ReviewSuggestionData,
  ): Promise<SuggestionWithImageUrls> {
    const suggestion = await this.getSuggestionOrThrow(id);

    if (suggestion.status !== 'PENDING') {
      throw new BadRequestError(
        'Esta sugestão já foi analisada',
        ErrorCodes.BAD_REQUEST,
      );
    }

    if (data.status === 'APPROVED') {
      // Cria o ponto de coleta real a partir dos dados da sugestão
      const point = await this.collectionPointRepository.create({
        name: suggestion.name,
        street: suggestion.street,
        number: suggestion.number,
        complement: suggestion.complement ?? undefined,
        neighborhood: suggestion.neighborhood ?? undefined,
        city: suggestion.city,
        state: suggestion.state,
        zipCode: suggestion.zipCode ?? undefined,
        country: suggestion.country,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        acceptedItems: suggestion.suggestedItems,
      });

      // Atualiza a sugestão com status aprovado e referência ao ponto criado
      const updated = await this.suggestionRepository.updateStatus(
        id,
        'APPROVED',
        data.adminNote,
        point.id,
      );

      // Notifica o usuário que a sugestão foi aprovada
      if (suggestion.user.email) {
        await this.emailQueueService.enqueueSuggestionReviewed(suggestion.user.email, {
          userName: suggestion.user.name,
          pointName: suggestion.name,
          status: 'APPROVED',
        });
      }

      return this.withImageUrls(updated);
    }

    // Rejeição
    const updated = await this.suggestionRepository.updateStatus(
      id,
      'REJECTED',
      data.adminNote,
    );

    // Notifica o usuário que a sugestão foi rejeitada
    if (suggestion.user.email) {
      await this.emailQueueService.enqueueSuggestionReviewed(suggestion.user.email, {
        userName: suggestion.user.name,
        pointName: suggestion.name,
        status: 'REJECTED',
        adminNote: data.adminNote,
      });
    }

    return this.withImageUrls(updated);
  }
}
