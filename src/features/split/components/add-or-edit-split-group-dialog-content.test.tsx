import { AddOrEditSplitGroupDialogContent } from "@/features/split/components/add-or-edit-split-group-dialog-content";
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

vi.mock("@/features/workspace/hooks/use-nav-workspace-id", () => ({
  useNavWorkspaceId: () => 1,
}));

vi.mock("@/features/currency/components/currency-select", () => ({
  CurrencySelect: ({
    label,
    value,
    onChange,
    disabled,
    hint,
  }: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    hint?: string;
  }) => (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span>{hint}</span> : null}
    </label>
  ),
}));

vi.mock("@/features/split/hooks/use-split-groups", () => ({
  useCreateSplitGroup: () => ({
    mutateAsync: mutateCreate,
    isPending: false,
  }),
  useUpdateSplitGroup: () => ({
    mutateAsync: mutateUpdate,
    isPending: false,
  }),
  useSplitGroup: () => ({ data: undefined }),
}));

vi.mock("@/features/split/components/split-group-members-step", () => ({
  SplitGroupMembersStep: () => <div>Members step</div>,
}));

describe("AddOrEditSplitGroupDialogContent", () => {
  beforeEach(() => {
    mutateCreate.mockReset();
    mutateUpdate.mockReset();
    mutateCreate.mockResolvedValue({ id: "group-1" });
    mutateUpdate.mockResolvedValue({});
  });

  it("does not create a group when the name is empty", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AddOrEditSplitGroupDialogContent
        open
        onOpenChange={vi.fn()}
        defaultCurrency="EUR"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "New split group" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Create & invite" }),
    );

    expect(mutateCreate).not.toHaveBeenCalled();
  });

  it("creates a group and advances to the invite step", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AddOrEditSplitGroupDialogContent
        open
        onOpenChange={vi.fn()}
        defaultCurrency="EUR"
      />,
    );

    await user.type(screen.getByLabelText("Group name"), "Barcelona trip");
    await user.click(
      screen.getByRole("button", { name: "Create & invite" }),
    );

    await waitFor(() => {
      expect(mutateCreate).toHaveBeenCalledWith({
        name: "Barcelona trip",
        defaultCurrency: "EUR",
      });
    });

    expect(
      await screen.findByRole("heading", { name: "Invite people" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Members step")).toBeInTheDocument();
  });

  it("locks currency after the first expense in edit mode", () => {
    renderWithProviders(
      <AddOrEditSplitGroupDialogContent
        open
        onOpenChange={vi.fn()}
        defaultCurrency="EUR"
        group={{
          id: "group-1",
          name: "Existing group",
          defaultCurrency: "EUR",
          expenseCount: 2,
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Edit group" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Balance currency")).toBeDisabled();
    expect(
      screen.getByText("Currency cannot be changed after the first expense"),
    ).toBeInTheDocument();
  });
});
