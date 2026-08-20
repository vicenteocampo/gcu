import nodemailer from "nodemailer";

// Gmail SMTP via an App Password — a stand-in until a real sending domain
// is set up on Resend. Swap this out (and lib/email/send.ts's call site)
// once that happens; Gmail caps personal accounts around ~500 sends/day.
let transporter: nodemailer.Transporter | null = null;

export function getMailer() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export function getEmailFrom() {
  return `GCU <${process.env.GMAIL_USER}>`;
}
