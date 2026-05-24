import { describe, expect, it } from "vitest";
import {
  getAuthRedirectPath,
  sanitizeAuthRedirect,
} from "./sanitize-auth-redirect";

describe("getAuthRedirectPath", () => {
  it("uses publicHref instead of concatenating pathname + search object", () => {
    expect(
      getAuthRedirectPath({
        publicHref: "/1/subscriptions",
        href: "/1/subscriptions",
        pathname: "/1/subscriptions",
        searchStr: "",
        hash: "",
      }),
    ).toBe("/1/subscriptions");
  });

  it("uses full href when it includes search and hash", () => {
    expect(
      getAuthRedirectPath({
        href: "/account?tab=profile#settings",
        pathname: "/account",
        searchStr: "?tab=profile",
        hash: "settings",
      }),
    ).toBe("/account?tab=profile#settings");
  });

  it("falls back to pathname, searchStr, and hash when href is empty", () => {
    expect(
      getAuthRedirectPath({
        href: "",
        pathname: "/account",
        searchStr: "?tab=profile",
        hash: "settings",
      }),
    ).toBe("/account?tab=profile#settings");
  });
});

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
