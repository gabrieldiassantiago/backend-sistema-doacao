import { describe, expect, test } from "bun:test";
import { WithdrawalRepository } from "../src/modules/withdrawal/withdrawal.repository";

const withdrawal = {
  causeId: "cause-1",
  userId: "user-1",
  amount: 100,
  pixKey: "payer@example.com",
};

describe("WithdrawalRepository.reserveBalanceAndCreate", () => {
  test("não cria saque quando a reserva condicional não altera a causa", async () => {
    let createCalled = false;
    const tx = {
      cause: { updateMany: async () => ({ count: 0 }) },
      withdrawal: {
        create: async () => {
          createCalled = true;
        },
      },
    };
    const prisma = { $transaction: (callback: (client: any) => unknown) => callback(tx) };
    const repository = new WithdrawalRepository(prisma as any);

    expect(await repository.reserveBalanceAndCreate(withdrawal)).toBeNull();
    expect(createCalled).toBe(false);
  });

  test("reserva o saldo e cria o saque na mesma transação", async () => {
    let receivedWhere: any;
    const created = { id: "withdrawal-1", ...withdrawal, status: "PENDING" };
    const tx = {
      cause: {
        updateMany: async (query: any) => {
          receivedWhere = query.where;
          return { count: 1 };
        },
      },
      withdrawal: { create: async () => created },
    };
    const prisma = { $transaction: (callback: (client: any) => unknown) => callback(tx) };
    const repository = new WithdrawalRepository(prisma as any);

    const result = await repository.reserveBalanceAndCreate(withdrawal);
    expect(result?.id).toBe(created.id);
    expect(receivedWhere).toEqual({
      id: "cause-1",
      authorId: "user-1",
      balance: { gte: 100 },
    });
  });
});
