import { RecordSettlementDialog } from "@/features/split/components/record-settlement-dialog";
import { renderWithProviders } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutateCreate = vi.fn();
const mutateUpdate = vi.fn();

vi.mock("@/features/shared/hooks/useResponsive", () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: "desktop",
  }),
}));

vi.mock("@/features/ui/input/decimal-input", () => ({
  DecimalInput: ({
    label,
    value,
    onChange,
  }: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  ),
}));

vi.mock("@/features/split/hooks/use-split-groups", () => ({
  useCreateSplitSettlement: () => ({
    mutateAsync: mutateCreate,
    isPending: false,
  }),
  useUpdateSplitSettlement: () => ({
    mutateAsync: mutateUpdate,
    isPending: false,
  }),
}));

const members = [
  { id: "me", displayName: "Me" },
  { id: "friend", displayName: "Alex" },
];

describe("RecordSettlementDialog", () => {
  beforeEach(() => {
    mutateCreate.mockReset();
    mutateUpdate.mockReset();
    mutateCreate.mockResolvedValue({});
    mutateUpdate.mockResolvedValue({});
  });

  it("keeps Record payment disabled until an amount is entered", () => {
    renderWithProviders(
      <RecordSettlementDialog
        open
        onOpenChange={vi.fn()}
        groupId="group-1"
        members={members}
        currency="EUR"
        currentMemberId="me"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Settle up" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Record payment" }),
    ).toBeDisabled();
  });

  it("records a settlement when amount and counterparty are set", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <RecordSettlementDialog
        open
        onOpenChange={onOpenChange}
        groupId="group-1"
        members={members}
        currency="EUR"
        currentMemberId="me"
      />,
    );

    await user.type(screen.getByLabelText("Amount"), "25.50");
    await user.click(screen.getByRole("button", { name: "Record payment" }));

    await waitFor(() => {
      expect(mutateCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          fromMemberId: "me",
          toMemberId: "friend",
          amount: "25.50",
        }),
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
