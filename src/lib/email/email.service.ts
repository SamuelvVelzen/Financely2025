/**
 * Email Service Abstraction Layer
 *
 * Sends auth emails via Resend when RESEND_API_KEY is set.
 * In development without Resend, logs metadata only (no URLs or tokens).
 */

import { getEmailProvider } from "./email-config";
import { sendEmailViaConsole } from "./providers/console.provider";
import { sendEmailViaResend } from "./providers/resend.provider";
import type {
  EmailOptions,
  MagicLinkEmailPayload,
  ResetPasswordEmailPayload,
  VerificationEmailPayload,
} from "./types";

export class EmailService {
  /**
   * Send email verification email
   */
  static async sendVerificationEmail(
    payload: VerificationEmailPayload
  ): Promise<void> {
    const { user, url } = payload;

    const emailOptions: EmailOptions = {
      to: user.email,
      subject: "Verify your email address",
      text: `Hello ${user.name || user.email},\n\nPlease verify your email address by clicking the link below:\n\n${url}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <h1>Verify your email address</h1>
        <p>Hello ${user.name || user.email},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${url}">Verify email</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await this.sendEmail(emailOptions);
  }

  /**
   * Send password reset email
   */
  static async sendResetPasswordEmail(
    payload: ResetPasswordEmailPayload
  ): Promise<void> {
    const { user, url } = payload;

    const emailOptions: EmailOptions = {
      to: user.email,
      subject: "Reset your password",
      text: `Hello ${user.name || user.email},\n\nYou requested to reset your password. Click the link below to reset it:\n\n${url}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <h1>Reset your password</h1>
        <p>Hello ${user.name || user.email},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <p><a href="${url}">Reset password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await this.sendEmail(emailOptions);
  }

  /**
   * Send magic link email
   */
  static async sendMagicLinkEmail(
    payload: MagicLinkEmailPayload
  ): Promise<void> {
    const { user, url } = payload;

    const emailOptions: EmailOptions = {
      to: user.email,
      subject: "Your magic link to sign in",
      text: `Hello ${user.name || user.email},\n\nClick the link below to sign in:\n\n${url}\n\nThis link will expire in 15 minutes and can only be used once.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <h1>Your magic link to sign in</h1>
        <p>Hello ${user.name || user.email},</p>
        <p>Click the link below to sign in:</p>
        <p><a href="${url}">Sign in</a></p>
        <p>This link will expire in 15 minutes and can only be used once.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await this.sendEmail(emailOptions);
  }

  private static async sendEmail(options: EmailOptions): Promise<void> {
    const provider = getEmailProvider();

    if (provider === "resend") {
      await sendEmailViaResend(options);
      return;
    }

    await sendEmailViaConsole(options);
  }
}
