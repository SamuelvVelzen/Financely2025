import { describe, expect, it } from "vitest";
import { sanitizeAuthRedirect } from "./sanitize-auth-redirect";

describe("sanitizeAuthRedirect", () => {
  it("returns / for missing or empty values", () => {
    expect(sanitizeAuthRedirect(undefined)).toBe("/");
    expect(sanitizeAuthRedirect(null)).toBe("/");
    expect(sanitizeAuthRedirect("")).toBe("/");
    expect(sanitizeAuthRedirect("   ")).toBe("/");
  });

  it("allows same-origin relative paths", () => {
    expect(sanitizeAuthRedirect("/5/transactions")).toBe("/5/transactions");
    expect(sanitizeAuthRedirect("/account?tab=profile")).toBe(
      "/account?tab=profile",
    );
  });

  it("blocks external and protocol-relative redirects", () => {
    expect(sanitizeAuthRedirect("https://evil.com")).toBe("/");
    expect(sanitizeAuthRedirect("//evil.com")).toBe("/");
    expect(sanitizeAuthRedirect("javascript:alert(1)")).toBe("/");
    expect(sanitizeAuthRedirect("evil.com")).toBe("/");
  });

  it("allows absolute URLs only for the trusted origin", () => {
    expect(
      sanitizeAuthRedirect("http://localhost:3000/5/tags", {
        origin: "http://localhost:3000",
      }),
    ).toBe("/5/tags");

    expect(
      sanitizeAuthRedirect("http://evil.com/5/tags", {
        origin: "http://localhost:3000",
      }),
    ).toBe("/");
  });
});
