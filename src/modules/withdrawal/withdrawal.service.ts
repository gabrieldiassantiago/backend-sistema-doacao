import { PrismaClient } from "../../../generated/prisma/client";
import { ICauseRepository } from "../cause/cause.repository";
import { IWithdrawalRepository } from "./withdrawal.repository";
import { CreateWithdrawalDTO } from "./withdrawal.schema";

export type WithdrawalResult = {
  id:          string;
  status:      string;
  amount:      number;
  pixKey:      string;
  causeTitle:  string;
  mpTransferId?: string;
};

export class WithdrawalService {
  constructor(
    private readonly withdrawalRepository: IWithdrawalRepository,
    private readonly causeRepository:      ICauseRepository,
    private readonly prisma:               PrismaClient,
  ) {}

  async create(data: CreateWithdrawalDTO, userId: string): Promise<WithdrawalResult> {
    const cause = await this.causeRepository.findById(data.causeId);
    if (!cause)                      throw new Error("Cause not found");
    if (cause.authorId !== userId)   throw new Error("Unauthorized");
    if (cause.balance < data.amount) throw new Error("Insufficient balance");

    // Reserva o saldo atomicamente antes de chamar o MP
    await this.prisma.cause.update({
      where: { id: cause.id },
      data:  { balance: { decrement: data.amount } },
    });

    // Cria o registro de saque como PENDING
    const withdrawal = await this.withdrawalRepository.create({
      causeId: data.causeId,
      userId,
      amount:  data.amount,
      pixKey:  data.pixKey,
    });
    return {
      id:        withdrawal.id,
      status:    withdrawal.status,
      amount:    withdrawal.amount,
      pixKey:    withdrawal.pixKey,
      causeTitle: cause.title,
    };
  }

  async findById(id: string) {
    return this.withdrawalRepository.findById(id);
  }

  async findByCause(causeId: string, userId: string, skip = 0, take = 20) {
    const cause = await this.causeRepository.findById(causeId);
    if (!cause)                    throw new Error("Cause not found");
    if (cause.authorId !== userId) throw new Error("Unauthorized");
    return this.withdrawalRepository.findByCause(causeId, skip, take);
  }

  async findByUser(userId: string, skip = 0, take = 20) {
    return this.withdrawalRepository.findByUser(userId, skip, take);
  }
}
