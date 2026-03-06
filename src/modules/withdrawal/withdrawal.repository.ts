import { PrismaClient, WithdrawalStatus } from "../../../generated/prisma/client";

export type CreateWithdrawalData = {
  causeId: string;
  userId:  string;
  amount:  number;
  pixKey:  string;
};

export interface IWithdrawalRepository {
  create(data: CreateWithdrawalData): Promise<any>;
  findById(id: string): Promise<any | null>;
  findByCause(causeId: string, skip: number, take: number): Promise<any[]>;
  findByUser(userId: string, skip: number, take: number): Promise<any[]>;
  updateStatus(id: string, status: WithdrawalStatus, extra?: { mpTransferId?: string; failReason?: string }): Promise<any>;
}

const withdrawalInclude = {
  cause: { select: { id: true, title: true, imageUrl: true } },
  user:  { select: { id: true, name: true, image: true } },
} as const;

export class WithdrawalRepository implements IWithdrawalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateWithdrawalData) {
    return this.prisma.withdrawal.create({ data, include: withdrawalInclude });
  }

  async findById(id: string) {
    return this.prisma.withdrawal.findUnique({ where: { id }, include: withdrawalInclude });
  }

  async findByCause(causeId: string, skip = 0, take = 20) {
    return this.prisma.withdrawal.findMany({
      where:   { causeId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: withdrawalInclude,
    });
  }

  async findByUser(userId: string, skip = 0, take = 20) {
    return this.prisma.withdrawal.findMany({
      where:   { userId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: withdrawalInclude,
    });
  }

  async updateStatus(
    id:     string,
    status: WithdrawalStatus,
    extra?: { mpTransferId?: string; failReason?: string },
  ) {
    return this.prisma.withdrawal.update({
      where: { id },
      data:  { status, ...extra },
    });
  }
}
