import type {
  CollectionPointSuggestion,
  SuggestionImage,
  SuggestionStatus,
} from '../../../../generated/prisma/client';

// ── Tipos compostos ─────────────────────────────────────────────────────────

export type SuggestionWithImages = CollectionPointSuggestion & {
  images: SuggestionImage[];
};

export type SuggestionWithImagesAndUser = SuggestionWithImages & {
  user: { id: string; name: string; email: string; image: string | null };
};

export type SuggestionImageWithUrl = SuggestionImage & { url: string };

export type SuggestionWithImageUrls = Omit<SuggestionWithImagesAndUser, 'images'> & {
  images: SuggestionImageWithUrl[];
};

// ── DTOs ─────────────────────────────────────────────────────────────────────

export type CreateSuggestionData = {
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
  latitude: number;
  longitude: number;
  suggestedItems: string[];
  reason?: string;
};

export type ReviewSuggestionData = {
  status: 'APPROVED' | 'REJECTED';
  adminNote?: string;
};

// ── Filtros ──────────────────────────────────────────────────────────────────

export type SuggestionFilterParams = {
  skip?: number;
  take?: number;
  status?: SuggestionStatus;
};

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface ISuggestionRepository {
  create(
    data: CreateSuggestionData,
    userId: string,
    imageKeys: string[],
  ): Promise<SuggestionWithImagesAndUser>;

  findById(id: string): Promise<SuggestionWithImagesAndUser | null>;

  findByUserId(
    userId: string,
    skip?: number,
    take?: number,
  ): Promise<SuggestionWithImagesAndUser[]>;

  findByStatus(
    status: SuggestionStatus,
    skip?: number,
    take?: number,
  ): Promise<SuggestionWithImagesAndUser[]>;

  countByStatus(status: SuggestionStatus): Promise<number>;

  updateStatus(
    id: string,
    status: SuggestionStatus,
    adminNote?: string,
    approvedPointId?: string,
  ): Promise<SuggestionWithImagesAndUser>;
}

export interface ISuggestionService {
  create(
    data: CreateSuggestionData,
    userId: string,
    imageKeys: string[],
  ): Promise<SuggestionWithImageUrls>;

  getById(id: string): Promise<SuggestionWithImageUrls | null>;

  getMySuggestions(
    userId: string,
    skip?: number,
    take?: number,
  ): Promise<SuggestionWithImageUrls[]>;

  getPending(
    skip?: number,
    take?: number,
  ): Promise<{ suggestions: SuggestionWithImageUrls[]; total: number }>;

  review(
    id: string,
    data: ReviewSuggestionData,
  ): Promise<SuggestionWithImageUrls>;
}
