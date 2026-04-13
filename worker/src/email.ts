/**
 * Email dispatch via Resend API for Early Thunder.
 */

import { buildWelcomeEmailHtml } from "./templates/welcome";

const RESEND_API_URL = "https://api.resend.com/emails";
const SENDER_ADDRESS = "Early Thunder <hello@earlythunder.com>";
const WELCOME_SUBJECT = "Welcome to Early Thunder \u2014 Your edge starts now";
const HTTP_OK = 200;
const HTTP_ACCEPTED = 202;

interface Env {
  readonly RESEND_API_KEY: string;
}

interface ResendPayload {
  readonly from: string;
  readonly to: string[];
  readonly subject: string;
  readonly html: string;
}

/**
 * Sends a branded welcome email to a new subscriber via Resend.
 * Returns true on success, false on failure (never throws).
 */
export async function sendWelcomeEmail(
  email: string,
  env: Env,
): Promise<boolean> {
  if (typeof email !== "string" || email.length === 0) {
    return false;
  }

  if (typeof env.RESEND_API_KEY !== "string" || env.RESEND_API_KEY.length === 0) {
    console.error("sendWelcomeEmail: RESEND_API_KEY is not configured");
    return false;
  }

  const html = buildWelcomeEmailHtml(email);

  const payload: ResendPayload = {
    from: SENDER_ADDRESS,
    to: [email],
    subject: WELCOME_SUBJECT,
    html,
  };

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status !== HTTP_OK && response.status !== HTTP_ACCEPTED) {
      const body = await response.text();
      console.error(`sendWelcomeEmail: Resend API returned ${response.status}: ${body}`);
      return false;
    }

    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`sendWelcomeEmail: fetch failed: ${message}`);
    return false;
  }
}
