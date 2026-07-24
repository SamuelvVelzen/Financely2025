import { DecimalInput } from "@/features/ui/input/decimal-input";
import { renderWithProviders } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

function ControlledDecimalInput({
  locale = "en-US",
  currency,
  initialValue = "",
}: {
  locale?: string;
  currency?: string;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <DecimalInput
        locale={locale}
        currency={currency}
        label="Amount"
        value={value}
        onChange={(next) => setValue(String(next ?? ""))}
      />
      <div data-testid="stored-value">{value}</div>
    </>
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

  it("shows USD with NumericFormat prefix", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ControlledDecimalInput locale="en-US" currency="USD" />
    );

    const input = screen.getByLabelText("Amount");
    await user.click(input);
    await user.keyboard("12.5");
    await user.tab();

    await waitFor(() => {
      expect(input).toHaveValue("$12.50");
    });
  });

  it("shows VND with NumericFormat prefix and no cents", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ControlledDecimalInput locale="en-US" currency="VND" />
    );

    const input = screen.getByLabelText("Amount");
    await user.click(input);
    await user.keyboard("3131");
    await user.tab();

    await waitFor(() => {
      expect(input).toHaveValue("₫3,131");
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

  it("keeps 25,0 as a decimal in nl-NL EUR (comma decimal)", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ControlledDecimalInput locale="nl-NL" currency="EUR" />
    );

    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("25,0");

    await waitFor(() => {
      expect(screen.getByTestId("stored-value")).toHaveTextContent("25.0");
      expect(input.value).toMatch(/25,0/);
      expect(input.value).not.toMatch(/250/);
    });

    await user.tab();
    await waitFor(() => {
      expect(screen.getByTestId("stored-value")).toHaveTextContent("25.00");
      expect(input.value).toMatch(/25,00/);
    });
  });

  it("treats typed period as decimal alias in nl-NL EUR", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ControlledDecimalInput locale="nl-NL" currency="EUR" />
    );

    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    await user.click(input);
    // Numpad / en-layout key often emits `.` even when locale decimal is `,`.
    await user.keyboard("25.0");

    await waitFor(() => {
      expect(screen.getByTestId("stored-value")).toHaveTextContent("25.0");
      expect(input.value).toMatch(/25,0/);
      expect(input.value).not.toMatch(/250/);
    });
  });

  it("formats large EUR amounts with thousand separators in de-DE", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ControlledDecimalInput locale="de-DE" currency="EUR" />
    );

    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234.5");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId("stored-value")).toHaveTextContent("1234.50");
      expect(input.value).toMatch(/1\.234,50/);
      expect(input.value).toContain("€");
    });
  });
});
