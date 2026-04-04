import { randomInt } from "crypto";
import { PrismaClient } from "../../../generated/prisma/client";
import { BadRequestError, TooManyRequestsError } from "../../errors/error-classes";
import { ErrorCodes } from "../../errors/error-codes";
import { container } from "../../container";

export class OtpService {
  private static readonly OTP_EXPIRY_MINUTES = 10;
  private static readonly RESEND_COOLDOWN_SECONDS = 60;

  constructor(private readonly prisma: PrismaClient) {}

  private generateOTP(): string {
    return String(randomInt(100_000, 999_999));
  }

  private identifierFor(email: string): string {
    return `otp:${email}`;
  }

  async sendOTP(email: string, userName: string): Promise<void> {
    const identifier = this.identifierFor(email);

    const existing = await this.prisma.verification.findFirst({
      where: { identifier },
    });

    if (existing) {
      const secondsSinceCreated =
        (Date.now() - existing.createdAt.getTime()) / 1000;

      if (secondsSinceCreated < OtpService.RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(OtpService.RESEND_COOLDOWN_SECONDS - secondsSinceCreated);
        throw new TooManyRequestsError(
          `Aguarde ${wait}s antes de solicitar um novo código.`,
          ErrorCodes.TOO_MANY_REQUESTS,
        );
      }

      await this.prisma.verification.deleteMany({ where: { identifier } });
    }

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + OtpService.OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.verification.create({
      data: { identifier, value: otp, expiresAt },
    });

    try {
      await container.emailQueueService.enqueueOtp(email, otp, userName);
    } catch (err) {
      await this.prisma.verification.deleteMany({ where: { identifier } });
      throw err;
    }
  }

  async verifyOTP(
    email: string,
    otp: string,
    userId: string,
  ): Promise<void> {
    const identifier = this.identifierFor(email);

    const record = await this.prisma.verification.findFirst({
      where: { identifier },
    });

    if (!record) {
      throw new BadRequestError("Nenhum código encontrado para este email.", ErrorCodes.OTP_NOT_FOUND);
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.verification.delete({ where: { id: record.id } });
      throw new BadRequestError("Código expirado. Solicite um novo.", ErrorCodes.OTP_EXPIRED);
    }

    if (record.value !== otp) {
      throw new BadRequestError("Código inválido.", ErrorCodes.OTP_INVALID);
    }

    await this.prisma.$transaction([
      this.prisma.verification.delete({ where: { id: record.id } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      }),
    ]);
  }

  async cleanupExpiredOTPs(): Promise<void> {
    const result = await this.prisma.verification.deleteMany({
        where: {
            identifier: { startsWith: "otp:" },
            expiresAt: { lt: new Date() },
        }
    });
    console.log(`Limpeza de OTPs: ${result.count} registros expirados removidos.`);
  }
}
