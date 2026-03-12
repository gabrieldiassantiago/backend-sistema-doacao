import type { WithdrawalStatus } from "../../../generated/prisma/client";

export type CreateWithdrawalData = {
  causeId: string;
  userId:  string;
  amount:  number;
  pixKey:  string;
};

export type WithdrawalResult = {
  id:           string;
  status:       string;
  amount:       number;
  pixKey:       string;
  causeTitle:   string;
  mpTransferId?: string;
};

export interface IWithdrawalRepository {
  create(data: CreateWithdrawalData): Promise<any>;
  findById(id: string): Promise<any | null>;
  findByCause(causeId: string, skip: number, take: number): Promise<any[]>;
  findByUser(userId: string, skip: number, take: number): Promise<any[]>;
  updateStatus(
    id: string,
    status: WithdrawalStatus,
    extra?: { mpTransferId?: string; failReason?: string },
  ): Promise<any>;
}

export interface IWithdrawalService {
  create(
    data: { causeId: string; amount: number; pixKey: string },
    userId: string,
  ): Promise<WithdrawalResult>;
  findById(id: string): Promise<any | null>;
  findByCause(causeId: string, userId: string, skip?: number, take?: number): Promise<any[]>;
  findByUser(userId: string, skip?: number, take?: number): Promise<any[]>;
}
