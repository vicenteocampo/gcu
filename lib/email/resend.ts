import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient() {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export const EMAIL_FROM = "GCU <hello@gcu.club>"; // TODO: confirm sending domain once verified in Resend
