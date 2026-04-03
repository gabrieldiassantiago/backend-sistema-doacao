import { Resend } from "resend";
// @ts-expect-error - missing typings for react-dom/server in this environment
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import OTPEmail from "../emails/otp";
import DonationConfirmationEmail from "../emails/donation-confirmation";
import PaymentFailedEmail from "../emails/payment-failed";
import { ExternalServiceError, InternalError } from "../errors/error-classes";
import { ErrorCodes } from "../errors/error-codes";

export type DonationConfirmationEmailParams = {
  userName: string;
  causeTitle: string;
  amount: number;
  xpEarned: number;
  newBadges: { name: string; icon: string }[];
  levelName: string;
};

export type PaymentFailedEmailParams = {
  userName: string;
  causeTitle: string;
  amount: number;
};

export interface IMailer {
  sendOTPEmail(to: string, otp: string, userName: string): Promise<void>;
  sendDonationConfirmationEmail(to: string, params: DonationConfirmationEmailParams): Promise<void>;
  sendPaymentFailedEmail(to: string, params: PaymentFailedEmailParams): Promise<void>;
}

export class ResendMailer implements IMailer {
  private readonly resend: Resend;
  private readonly from: string;

  constructor(opts?: { apiKey?: string; from?: string }) {
    const apiKey = opts?.apiKey ?? process.env.RESEND_API_KEY;
    const from = opts?.from ?? process.env.EMAIL_FROM;

    const missing: string[] = [];
    if (!apiKey) missing.push("RESEND_API_KEY");
    if (!from) missing.push("EMAIL_FROM");

    if (missing.length > 0) {
      throw new InternalError(
        "Serviço de email não configurado",
        ErrorCodes.INTERNAL_ERROR,
        { missing },
      );
    }

    this.resend = new Resend(apiKey!);
    this.from = from!;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [to],
      subject,
      html,
    });

    if (error) {
      throw new ExternalServiceError(
        "Falha ao enviar email",
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
        { provider: "resend", message: error.message },
      );
    }
  }

  async sendOTPEmail(to: string, otp: string, userName: string): Promise<void> {
    const html = renderToStaticMarkup(
      React.createElement(OTPEmail, { otp, userName }),
    );

    await this.send(to, "🔐 Código de verificação de email", html);
  }

  async sendDonationConfirmationEmail(
    to: string,
    params: DonationConfirmationEmailParams,
  ): Promise<void> {
    const html = renderToStaticMarkup(
      React.createElement(DonationConfirmationEmail, params),
    );

    await this.send(to, "💚 Sua doação foi confirmada!", html);
  }

  async sendPaymentFailedEmail(
    to: string,
    params: PaymentFailedEmailParams,
  ): Promise<void> {
    const html = renderToStaticMarkup(
      React.createElement(PaymentFailedEmail, params),
    );

    await this.send(to, "⚠️ Aviso: Problema com o seu pagamento", html);
  }
}

let mailer: IMailer | null = null;

export function getMailer(): IMailer {
  if (!mailer) mailer = new ResendMailer();
  return mailer;
}

export function setMailer(next: IMailer | null): void {
  mailer = next;
}

export async function sendOTPEmail(
  to: string,
  otp: string,
  userName: string,
): Promise<void> {
  return getMailer().sendOTPEmail(to, otp, userName);
}

export async function sendDonationConfirmationEmail(
  to: string,
  params: DonationConfirmationEmailParams,
): Promise<void> {
  return getMailer().sendDonationConfirmationEmail(to, params);
}

export async function sendPaymentFailedEmail(
  to: string,
  params: PaymentFailedEmailParams,
): Promise<void> {
  return getMailer().sendPaymentFailedEmail(to, params);
}
