import { Resend } from "resend";
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import OTPEmail from "../emails/otp";
import DonationConfirmationEmail from "../emails/donation-confirmation";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.EMAIL_FROM ?? '';

export async function sendOTPEmail(
  to: string,
  otp: string,
  userName: string,
): Promise<void> {
  const html = renderToStaticMarkup(
    React.createElement(OTPEmail, { otp, userName }),
  );

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    subject: "🔐 Código de verificação de email",
    html,
  });
}

export async function sendDonationConfirmationEmail(
  to: string,
  params: {
    userName: string;
    causeTitle: string;
    amount: number;
    xpEarned: number;
    newBadges: { name: string; icon: string }[];
    levelName: string;
  },
): Promise<void> {
  const html = renderToStaticMarkup(
    React.createElement(DonationConfirmationEmail, params),
  );

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    subject: "💚 Sua doação foi confirmada!",
    html,
  });
}
