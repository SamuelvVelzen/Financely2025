import { DecimalInput } from "@/features/ui/input/decimal-input";
import { renderWithProviders } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

function ControlledDecimalInput({
  locale = "en-US",
  initialValue = "",
}: {
  locale?: string;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <DecimalInput
      locale={locale}
      label="Amount"
      value={value}
      onChange={(next) => setValue(String(next ?? ""))}
    />
  );
}

describe("DecimalInput", () => {
  it("types a large integer from an empty field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledDecimalInput locale="en-US" />);

    const input = screen.getByLabelText("Amount");
    await user.click(input);
    await user.keyboard("300000");

    await waitFor(() => {
      expect(input).toHaveValue("300,000");
    });
  });

  it("inserts a digit in the middle of the integer part", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ControlledDecimalInput locale="en-US" initialValue="3000.00" />
    );

    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    await user.click(input);

    // Place caret between 3 and 0 in "3,000.00"
    input.setSelectionRange(1, 1);
    await user.keyboard("2");

    await waitFor(() => {
      expect(input).toHaveValue("32,000.00");
    });
  });

  it("backspaces a trailing cent digit from the right", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ControlledDecimalInput locale="en-US" initialValue="3000.03" />
    );

    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    await user.click(input);
    input.setSelectionRange(input.value.length, input.value.length);
    await user.keyboard("{Backspace}");

    await waitFor(() => {
      expect(input).toHaveValue("3,000.0");
    });
  });

  it("pads to two decimals on blur", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledDecimalInput locale="en-US" />);

    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("12.5");
    await user.tab();

    await waitFor(() => {
      expect(input).toHaveValue("12.50");
    });
  });
});
