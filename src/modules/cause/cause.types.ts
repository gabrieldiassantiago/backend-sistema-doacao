import type { Cause, DocStatus, DocType, Prisma } from "../../../generated/prisma/client";

export type CauseWithRelations = Prisma.CauseGetPayload<{
  include: {
    author: {
      select: { id: true; name: true; image: true };
    };
    category: {
      select: { id: true; name: true; description: true };
    };
    images: {
      orderBy: { position: "asc" };
    };
    documents: true;
    _count: {
      select: { donations: true };
    };
  };
}>;

export type CauseWithDonationCount = Omit<CauseWithRelations, "_count"> & { donationsCount: number };

export type CauseDocument = Prisma.CauseDocumentGetPayload<{}>;
export type CauseDocumentWithUrl = CauseDocument & { url: string };

export type CauseFilterSort =
  | "most_popular"  // ORDER BY doações DESC
  | "most_urgent"   // ORDER BY (raised / goalAmount) ASC — menor % do goal atingido
  | "nearest"       // ORDER BY distância (Haversine) ASC — requer lat/lng
  | "recent";       // ORDER BY createdAt DESC (padrão)

export type CauseFilterParams = {
  skip?: number;
  take?: number;
  /** Ordenação das causas. */
  sort?: CauseFilterSort;
  /** Filtro por nome de cidade (case-insensitive). */
  city?: string;
  /** Filtro por estado (case-insensitive). */
  state?: string;
  /** Latitude do usuário para cálculo de distância (requer sort=nearest). */
  lat?: number;
  /** Longitude do usuário para cálculo de distância (requer sort=nearest). */
  lng?: number;
  /** Raio máximo em km para o filtro de proximidade (padrão: 50). */
  radius?: number;
  /** Filtro por categoria. */
  categoryId?: string;
  /** Busca por título ou descrição. */
  search?: string;
};

type LocationData = {
  locationName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

export type CauseCreateData = {
  title: string;
  description: string;
  goalAmount: number;
  isFeatured?: boolean;
  categoryId: string;
  imageKeys?: string[];
} & LocationData;

export type CauseUpdateData = {
  title?: string;
  description?: string;
  goalAmount?: number;
  isFeatured?: boolean;
  categoryId?: string;
  imageKeys?: string[];
  images?: File[];
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
} & LocationData;

export interface ICauseRepository {
  create(
    data: Prisma.CauseUncheckedCreateInput,
    imageKeys?: string[]
  ): Promise<CauseWithRelations>;

  findById(id: string): Promise<CauseWithRelations | null>;
  findActiveCauses(filters?: CauseFilterParams): Promise<CauseWithRelations[]>;
  findPendingCauses(): Promise<CauseWithRelations[]>;


  update(
    id: string,
    data: Prisma.CauseUpdateInput,
    imageKeys?: string[]
  ): Promise<CauseWithRelations>;

  delete(id: string): Promise<Cause>;

  addDocument(data: Prisma.CauseDocumentUncheckedCreateInput): Promise<CauseDocument>;
  getDocumentsByCause(causeId: string): Promise<CauseDocument[]>;
  updateDocumentStatus(id: string, status: DocStatus, rejectionReason?: string): Promise<CauseDocument>;
  updateCauseVerification(id: string, status: string, isVerified: boolean): Promise<Cause>;
}

export interface ICauseService {
  create(
    data: CauseCreateData,
    authorId: string
  ): Promise<CauseWithDonationCount>;

  getCauseById(id: string): Promise<CauseWithDonationCount | null>;
  getActiveCauses(filters?: CauseFilterParams): Promise<CauseWithDonationCount[]>;
  getPendingCauses(adminId: string): Promise<CauseWithDonationCount[]>;

  updateCause(
    id: string,
    data: CauseUpdateData,
    userId: string
  ): Promise<CauseWithDonationCount>;

  deleteCause(id: string, userId: string): Promise<Cause>;

  attachDocument(causeId: string, userId: string, fileKey: string, fileName: string, docType: DocType): Promise<CauseDocumentWithUrl>;
  getDocuments(causeId: string, userId: string): Promise<CauseDocumentWithUrl[]>;
  reviewDocument(docId: string, status: DocStatus, adminId: string, rejectionReason?: string): Promise<CauseDocumentWithUrl>;
  moderateCause(causeId: string, status: string, isVerified: boolean, adminId: string): Promise<Cause>;
}
