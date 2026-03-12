import { PrismaClient } from "../../../generated/prisma/client";
import type {
  CreatePaymentData,
  IPaymentRepository,
  PaymentStatusValue,
  PaymentUpdate,
} from "./payment.types";

export class PaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePaymentData) {
    return this.prisma.payment.create({ data });
  }

  async findById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        cause: { select: { id: true, title: true, imageUrl: true } },
        user:  { select: { id: true, name: true, image: true } },
      },
    });
  }

  async findByMpId(mpPaymentId: string) {
    return this.prisma.payment.findUnique({ where: { mpPaymentId } });
  }

  async updateStatus(id: string, status: PaymentStatusValue, extra?: PaymentUpdate) {
    return this.prisma.payment.update({
      where: { id },
      data:  { status, ...extra },
    });
  }

  async findByUser(userId: string, skip = 0, take = 20) {
    return this.prisma.payment.findMany({
      where:   { userId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        cause: { select: { id: true, title: true, imageUrl: true } },
      },
    });
  }

  async findByCause(causeId: string, skip = 0, take = 20) {
    return this.prisma.payment.findMany({
      where:   { causeId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
  }
}
