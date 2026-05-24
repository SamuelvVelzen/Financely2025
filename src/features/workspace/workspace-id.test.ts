import { describe, expect, it } from "vitest";
import {
  parseWorkspaceIdParam,
  workspaceIdToRouteParam,
  workspaceIdToUrlSegment,
} from "./workspace-id";

describe("parseWorkspaceIdParam", () => {
  it("parses positive integer strings", () => {
    expect(parseWorkspaceIdParam("1")).toBe(1);
    expect(parseWorkspaceIdParam("42")).toBe(42);
  });

  it("rejects invalid values", () => {
    expect(parseWorkspaceIdParam(undefined)).toBeNull();
    expect(parseWorkspaceIdParam("")).toBeNull();
    expect(parseWorkspaceIdParam("abc")).toBeNull();
    expect(parseWorkspaceIdParam("1.5")).toBeNull();
    expect(parseWorkspaceIdParam("-1")).toBeNull();
    expect(parseWorkspaceIdParam("01")).toBe(1);
  });
});

describe("workspace id formatting", () => {
  it("converts ids to URL segments", () => {
    expect(workspaceIdToUrlSegment(7)).toBe("7");
    expect(workspaceIdToRouteParam(7)).toBe("7");
    expect(workspaceIdToRouteParam(null)).toBe("");
  });
});
