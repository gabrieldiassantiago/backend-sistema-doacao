import type { ICauseRepository } from "../cause/cause.types";
import type { IWithdrawalRepository, IWithdrawalService, WithdrawalResult } from "./withdrawal.types";
import type { CreateWithdrawalDTO } from "./withdrawal.schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";

export class WithdrawalService implements IWithdrawalService {
  constructor(
    private readonly withdrawalRepository: IWithdrawalRepository,
    private readonly causeRepository:      ICauseRepository,
  ) {}

  async create(data: CreateWithdrawalDTO, userId: string): Promise<WithdrawalResult> {
    const cause = await this.causeRepository.findById(data.causeId);
    if (!cause) {
      throw new NotFoundError("Causa não encontrada", ErrorCodes.CAUSE_NOT_FOUND);
    }

    if (cause.authorId !== userId) {
      throw new ForbiddenError("Você não é o dono desta causa", ErrorCodes.FORBIDDEN);
    }

    // A reserva e o registro do saque são uma única operação atômica. O filtro
    // condicional impede que duas requisições consumam o mesmo saldo.
    const withdrawal = await this.withdrawalRepository.reserveBalanceAndCreate({
      causeId: data.causeId,
      userId,
      amount:  data.amount,
      pixKey:  data.pixKey,
    });

    if (!withdrawal) {
      throw new BadRequestError("Saldo insuficiente na causa", ErrorCodes.INSUFFICIENT_BALANCE);
    }
    
    return {
      id:        withdrawal.id,
      status:    withdrawal.status,
      amount:    withdrawal.amount,
      pixKey:    withdrawal.pixKey,
      causeTitle: cause.title,
    };
  }

  async findById(id: string, userId: string) {
    const withdrawal = await this.withdrawalRepository.findById(id);
    if (withdrawal && withdrawal.userId !== userId) {
      throw new ForbiddenError("Acesso negado", ErrorCodes.FORBIDDEN);
    }
    return withdrawal;
  }

  async findByCause(causeId: string, userId: string, skip = 0, take = 20) {
    const cause = await this.causeRepository.findById(causeId);
    
    if (!cause) {
      throw new NotFoundError("Causa não encontrada", ErrorCodes.CAUSE_NOT_FOUND);
    }

    if (cause.authorId !== userId) {
      throw new ForbiddenError("Acesso negado", ErrorCodes.FORBIDDEN);
    }

    return this.withdrawalRepository.findByCause(causeId, skip, take);
  }

  async findByUser(userId: string, skip = 0, take = 20) {
    return this.withdrawalRepository.findByUser(userId, skip, take);
  }
}
