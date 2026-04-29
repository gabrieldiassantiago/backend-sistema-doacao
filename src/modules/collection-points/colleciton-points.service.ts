import type { CollectionPoint } from '../../../generated/prisma/client';
import { NotFoundError } from '../../errors/error-classes';
import { ErrorCodes } from '../../errors/error-codes';
import type {
  ICollectionPointRepository,
  ICollectionPointService,
  CreateCollectionPointData,
  UpdateCollectionPointData,
  CollectionPointWithItems,
  CollectionPointFilterParams,
} from './colleciton-points.types';

export class CollectionPointService implements ICollectionPointService {
  constructor(
    private readonly collectionPointRepository: ICollectionPointRepository,
  ) {}

  async create(data: CreateCollectionPointData): Promise<CollectionPointWithItems> {
    return this.collectionPointRepository.create(data);
  }

  async getById(id: string): Promise<CollectionPointWithItems | null> {
    return this.collectionPointRepository.findById(id);
  }

  async getAll(skip = 0, take = 20): Promise<CollectionPointWithItems[]> {
    return this.collectionPointRepository.findAll(skip, take);
  }

  async getActive(filters: CollectionPointFilterParams = {}): Promise<CollectionPointWithItems[]> {
    return this.collectionPointRepository.findActive(filters);
  }

  async update(id: string, data: UpdateCollectionPointData): Promise<CollectionPointWithItems> {
    const point = await this.collectionPointRepository.findById(id);
    if (!point) {
      throw new NotFoundError('Ponto de coleta não encontrado', ErrorCodes.COLLECTION_POINT_NOT_FOUND);
    }
    return this.collectionPointRepository.update(id, data);
  }

  async delete(id: string): Promise<CollectionPoint> {
    const point = await this.collectionPointRepository.findById(id);
    if (!point) {
      throw new NotFoundError('Ponto de coleta não encontrado', ErrorCodes.COLLECTION_POINT_NOT_FOUND);
    }
    return this.collectionPointRepository.delete(id);
  }
}
