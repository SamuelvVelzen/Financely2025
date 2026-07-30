import { describe, expect, it } from "vitest";
import { isIosDevice } from "./pwa-install-platform";

describe("isIosDevice", () => {
  it("detects iPhone and iPad user agents", () => {
    expect(
      isIosDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      )
    ).toBe(true);
    expect(
      isIosDevice(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      )
    ).toBe(true);
  });

  it("detects iPadOS desktop UA with touch", () => {
    expect(
      isIosDevice(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        { platform: "MacIntel", maxTouchPoints: 5 }
      )
    ).toBe(true);
  });

  it("rejects desktop Mac without touch", () => {
    expect(
      isIosDevice(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        { platform: "MacIntel", maxTouchPoints: 0 }
      )
    ).toBe(false);
  });

  it("rejects Android and desktop Chrome", () => {
    expect(
      isIosDevice(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      )
    ).toBe(false);
    expect(
      isIosDevice(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      )
    ).toBe(false);
  });
});
