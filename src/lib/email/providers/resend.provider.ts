import type { EmailOptions } from "../types";
import { getEmailFrom, getResendApiKey } from "../email-config";

interface IResendSendResponse {
  id?: string;
  message?: string;
}

export async function sendEmailViaResend(options: EmailOptions): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Resend API failed (${response.status}): ${body || response.statusText}`
    );
  }

  const result = (await response.json()) as IResendSendResponse;
  if (!result.id) {
    throw new Error(
      `Resend API returned an unexpected response: ${result.message ?? "missing email id"}`
    );
  }
}
