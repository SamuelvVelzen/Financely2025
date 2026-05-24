import { describe, expect, it, afterEach } from "vitest";
import {
  getEmailFrom,
  getEmailProvider,
  getResendApiKey,
} from "./email-config";

describe("email-config", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses console provider in non-production without Resend", () => {
    process.env.NODE_ENV = "development";
    delete process.env.RESEND_API_KEY;

    expect(getEmailProvider()).toBe("console");
  });

  it("uses resend when API key is set", () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "Financely <test@example.com>";

    expect(getEmailProvider()).toBe("resend");
    expect(getEmailFrom()).toBe("Financely <test@example.com>");
  });

  it("throws in production without Resend configured", () => {
    process.env.NODE_ENV = "production";
    delete process.env.RESEND_API_KEY;

    expect(() => getEmailProvider()).toThrow(/RESEND_API_KEY/);
  });

  it("throws when Resend is set without EMAIL_FROM", () => {
    process.env.RESEND_API_KEY = "re_test_key";
    delete process.env.EMAIL_FROM;

    expect(() => getEmailFrom()).toThrow(/EMAIL_FROM/);
  });

  it("returns the configured Resend API key", () => {
    process.env.RESEND_API_KEY = "re_test_key";
    expect(getResendApiKey()).toBe("re_test_key");
  });
});
