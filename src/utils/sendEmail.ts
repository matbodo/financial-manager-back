import { Send } from "express";
import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: SendEmailOptions) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Gestor Financeiro" <${process.env.EMAIL_FROM || "no-reply@gestor.com"}>`,
    to: options.to,
    subject: process.subject,
    html: options.html,
  });
};
