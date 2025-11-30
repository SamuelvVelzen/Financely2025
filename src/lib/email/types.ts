/**
 * Email service types
 * Type-safe email payloads for all authentication emails
 */

export interface EmailUser {
  email: string;
  name?: string;
  id: string;
}

export interface VerificationEmailPayload {
  user: EmailUser;
  url: string;
  token: string;
}

export interface ResetPasswordEmailPayload {
  user: EmailUser;
  url: string;
  token: string;
}

export interface MagicLinkEmailPayload {
  user: EmailUser;
  url: string;
  token: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}


