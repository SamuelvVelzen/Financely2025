import { describe, expect, it } from "vitest";
import { getClientIp } from "./get-client-ip";

describe("getClientIp", () => {
  it("reads the first x-forwarded-for address", () => {
    const request = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });
    expect(getClientIp(request)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    const request = new Request("http://localhost/", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    expect(getClientIp(request)).toBe("198.51.100.2");
  });

  it("returns unknown when no proxy headers exist", () => {
    const request = new Request("http://localhost/");
    expect(getClientIp(request)).toBe("unknown");
  });
});
