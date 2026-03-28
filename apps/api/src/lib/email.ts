import nodemailer from "nodemailer";
import type { Logger } from "pino";

export type TransactionalMail = {
  to: string;
  subject: string;
  text: string;
};

export function createMailer(logger: Logger) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    return {
      send: async (_mail: TransactionalMail) => {
        logger.warn("SMTP_HOST is not set; email was not sent");
      },
    };
  }

  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: Number(process.env.SMTP_PORT ?? "587") === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  });

  return {
    send: async (mail: TransactionalMail) => {
      const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
      if (!from) {
        logger.error("SMTP_FROM or SMTP_USER is required when SMTP_HOST is set");
        return;
      }
      await transport.sendMail({
        from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
      });
    },
  };
}
