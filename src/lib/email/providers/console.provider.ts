import type { EmailOptions } from "../types";

/**
 * Development-only fallback when RESEND_API_KEY is not set.
 * Never logs email body, URLs, or tokens.
 */
export async function sendEmailViaConsole(options: EmailOptions): Promise<void> {
  console.info(
    `[Email] (dev) Would send "${options.subject}" to ${options.to}. Set RESEND_API_KEY and EMAIL_FROM to deliver mail.`
  );
}
