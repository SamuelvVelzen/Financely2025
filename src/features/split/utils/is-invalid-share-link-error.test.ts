import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/features/shared/api/client";
import { isInvalidShareLinkError } from "./is-invalid-share-link-error";

describe("isInvalidShareLinkError", () => {
  it("matches plain Invalid share link errors", () => {
    expect(isInvalidShareLinkError(new Error("Invalid share link"))).toBe(true);
  });

  it("matches API NOT_FOUND client errors", () => {
    expect(
      isInvalidShareLinkError(
        new ApiClientError("NOT_FOUND", "Invalid share link", 404),
      ),
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(
      isInvalidShareLinkError(
        new ApiClientError("UNAUTHORIZED", "Guest session required", 401),
      ),
    ).toBe(false);
  });
});
