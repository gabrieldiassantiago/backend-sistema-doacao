import nodemailer from "nodemailer";
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import OTPEmail from "../emails/otp";
import DonationConfirmationEmail from "../emails/donation-confirmation";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(
  to: string,
  otp: string,
  userName: string,
): Promise<void> {
    
  const html = renderToStaticMarkup(
    React.createElement(OTPEmail, { otp, userName }),
  );

  await transporter.sendMail({
    from: `"Doação" <${process.env.SMTP_FROM}>`,
    to,
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

  await transporter.sendMail({
    from: `"Doação" <${process.env.SMTP_FROM}>`,
    to,
    subject: "💚 Sua doação foi confirmada!",
    html,
  });
}
