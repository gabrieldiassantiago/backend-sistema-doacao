import nodemailer from "nodemailer";
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import OTPEmail from "../emails/otp";

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
