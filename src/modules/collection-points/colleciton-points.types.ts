import type { CollectionPoint, AcceptedItem, Prisma } from '../../../generated/prisma/client';

export type CollectionPointWithItems = CollectionPoint & {
  acceptedItems: AcceptedItem[];
};

export type CreateCollectionPointData = {
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
  acceptedItems: string[]; // lista de nomes dos itens aceitos
};

export type UpdateCollectionPointData = Partial<Omit<CreateCollectionPointData, 'acceptedItems'>> & {
  acceptedItems?: string[];
  isActive?: boolean;
};

export interface ICollectionPointRepository {
  create(data: CreateCollectionPointData): Promise<CollectionPointWithItems>;
  findById(id: string): Promise<CollectionPointWithItems | null>;
  findAll(skip?: number, take?: number): Promise<CollectionPointWithItems[]>;
  findActive(skip?: number, take?: number): Promise<CollectionPointWithItems[]>;
  update(id: string, data: UpdateCollectionPointData): Promise<CollectionPointWithItems>;
  delete(id: string): Promise<CollectionPoint>;
}

export interface ICollectionPointService {
  create(data: CreateCollectionPointData): Promise<CollectionPointWithItems>;
  getById(id: string): Promise<CollectionPointWithItems | null>;
  getAll(skip?: number, take?: number): Promise<CollectionPointWithItems[]>;
  getActive(skip?: number, take?: number): Promise<CollectionPointWithItems[]>;
  update(id: string, data: UpdateCollectionPointData): Promise<CollectionPointWithItems>;
  delete(id: string): Promise<CollectionPoint>;
}
