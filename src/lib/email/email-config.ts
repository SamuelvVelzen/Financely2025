export type EmailProvider = "resend" | "console";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY?.trim()) {
    return "resend";
  }
  if (isProduction()) {
    throw new Error(
      "RESEND_API_KEY is required in production. Set RESEND_API_KEY and EMAIL_FROM to send auth emails."
    );
  }
  return "console";
}

export function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error(
      "EMAIL_FROM is required when RESEND_API_KEY is set (e.g. Financely <noreply@yourdomain.com>)."
    );
  }
  return from;
}

export function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  return apiKey;
}
