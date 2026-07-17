import { PrismaClient, WithdrawalStatus } from "../../../generated/prisma/client";
import type { CreateWithdrawalData, IWithdrawalRepository } from "./withdrawal.types";

const withdrawalInclude = {
  cause: { select: { id: true, title: true, images: true } },
  user: { select: { id: true, name: true, image: true } },
} as const;

export class WithdrawalRepository implements IWithdrawalRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async create(data: CreateWithdrawalData) {
    return this.prisma.withdrawal.create({ data, include: withdrawalInclude });
  }

  async reserveBalanceAndCreate(data: CreateWithdrawalData) {
    return this.prisma.$transaction(async (tx) => {
      const reserved = await tx.cause.updateMany({
        where: {
          id: data.causeId,
          authorId: data.userId,
          balance: { gte: data.amount },
        },
        data: { balance: { decrement: data.amount } },
      });

      if (reserved.count !== 1) return null;

      return tx.withdrawal.create({ data, include: withdrawalInclude });
    });
  }

  async findById(id: string) {
    return this.prisma.withdrawal.findUnique({ where: { id }, include: withdrawalInclude });
  }

  async findByCause(causeId: string, skip = 0, take = 20) {
    return this.prisma.withdrawal.findMany({
      where: { causeId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: withdrawalInclude,
    });
  }

  async findByUser(userId: string, skip = 0, take = 20) {
    return this.prisma.withdrawal.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: withdrawalInclude,
    });
  }

  async updateStatus(
    id: string,
    status: WithdrawalStatus,
    extra?: { mpTransferId?: string; failReason?: string },
  ) {
    return this.prisma.withdrawal.update({
      where: { id },
      data: { status, ...extra },
    });
  }
}
