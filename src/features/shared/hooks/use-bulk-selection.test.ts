/** @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBulkSelection } from "./use-bulk-selection";

describe("useBulkSelection", () => {
  it("toggles ids and reports selection state", () => {
    const { result, rerender } = renderHook(
      ({ visibleIds }: { visibleIds: string[] }) =>
        useBulkSelection(visibleIds),
      { initialProps: { visibleIds: ["a", "b", "c"] } },
    );

    act(() => {
      result.current.toggle("b");
    });

    expect(result.current.isSelected("b")).toBe(true);
    expect(result.current.selectedCount).toBe(1);

    act(() => {
      result.current.selectAllVisible();
    });

    expect(result.current.allVisibleSelected).toBe(true);

    act(() => {
      result.current.clear();
    });

    expect(result.current.selectedCount).toBe(0);

    act(() => {
      result.current.toggle("a");
    });

    rerender({ visibleIds: ["a", "c"] });

    expect(result.current.isSelected("a")).toBe(true);

    act(() => {
      result.current.replaceSelection(new Set(["a", "c"]));
    });

    expect(result.current.allVisibleSelected).toBe(true);
  });
});