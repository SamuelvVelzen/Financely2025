import { describe, expect, it, vi, beforeEach } from "vitest";
import { withWorkspaceRateLimit } from "./with-workspace-rate-limit";

describe("withWorkspaceRateLimit", () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_DISABLED = "false";
  });

  it("calls the handler when under the limit", async () => {
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const wrapped = withWorkspaceRateLimit(
      `test-ok-${Date.now()}`,
      { limit: 5, windowMs: 60_000 },
      handler,
    );

    const response = await wrapped({
      request: new Request("http://localhost/"),
      params: { workspaceId: "1" },
    });

    expect(handler).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
  });

  it("returns 429 without calling the handler when limited", async () => {
    const bucket = `test-block-${Date.now()}`;
    const policy = { limit: 1, windowMs: 60_000 };
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const wrapped = withWorkspaceRateLimit(bucket, policy, handler);

    const args = {
      request: new Request("http://localhost/"),
      params: { workspaceId: "99" },
    };

    await wrapped(args);
    const blocked = await wrapped(args);

    expect(handler).toHaveBeenCalledOnce();
    expect(blocked.status).toBe(429);
  });
});
