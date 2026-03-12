import { randomInt } from "crypto";
import { sendOTPEmail } from "../../lib/mailer";
import { PrismaClient } from "../../../generated/prisma/client";

const OTP_EXPIRY_MINUTES = 10;

const RESEND_COOLDOWN_SECONDS = 60;

export class OtpService {
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

      if (secondsSinceCreated < RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceCreated);
        throw new Error(
          `Aguarde ${wait}s antes de solicitar um novo código.`,
        );
      }

      // Remove OTP anterior para criar um novo
      await this.prisma.verification.deleteMany({ where: { identifier } });
    }

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.verification.create({
      data: { identifier, value: otp, expiresAt },
    });

    try {
      await sendOTPEmail(email, otp, userName);
    } catch (err) {
      await this.prisma.verification.deleteMany({ where: { identifier } });
      throw err;
    }
  }

  async verifyOTP(
    email: string,
    otp: string,
    userId: string,
  ): Promise<{ success: boolean; reason?: string }> {
    
    const identifier = this.identifierFor(email);

    const record = await this.prisma.verification.findFirst({
      where: { identifier },
    });

    if (!record) {
      return { success: false, reason: "Nenhum código encontrado para este email." };
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.verification.delete({ where: { id: record.id } });
      return { success: false, reason: "Código expirado. Solicite um novo." };
    }

    if (record.value !== otp) {
      return { success: false, reason: "Código inválido." };
    }

    await this.prisma.$transaction([
      this.prisma.verification.delete({ where: { id: record.id } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      }),
    ]);

    return { success: true };
  }

  async cleanupExpiredOTPs(): Promise<void> {
    const result = await this.prisma.verification.deleteMany({
        where: {
            identifier: { startsWith: "otp:" },
            expiresAt: { lt: new Date() },
        }
    })
    console.log(`Limpeza de OTPs: ${result.count} registros expirados removidos.`);
  }
}
