"use client";

import { Checkbox } from "@/features/ui/checkbox/checkbox";
import { Container } from "@/features/ui/container/container";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { DialogTrigger } from "@/features/ui/dialog/dialog/dialog-trigger";
import { useDialog } from "@/features/ui/dialog/dialog/use-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { Form } from "@/features/ui/form/form";
import { ColorInput } from "@/features/ui/input/color-input";
import { NumberInput } from "@/features/ui/input/number-input";
import { TextInput } from "@/features/ui/input/text-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { Title } from "@/features/ui/typography/title";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const Route = createFileRoute("/(app)/")({
  component: Home,
});

function Home() {
  return (
    <>
      <Container className="mb-4">
        <Title>Dashboard</Title>
        <p className="text-text-muted text-sm">
          Welcome to Financely. Manage your finances with ease.
        </p>
      </Container>

      <Container className="mb-4">
        <h2 className="text-lg font-semibold mb-4">Dialog Examples</h2>
        <div className="space-y-4">
          <DefaultDialogExample />
          <CustomDialogExample />
          <FormDialogExample />
        </div>
      </Container>

      <Container className="mb-4">
        <h2 className="text-lg font-semibold mb-4">Select Dropdown Examples</h2>
        <div className="space-y-4">
          <SelectDropdownExample />
        </div>

        <Dropdown>
          <DropdownItem text="Option 1" />
          <DropdownItem text="Option 2" />
          <DropdownItem text="Option 3" />
        </Dropdown>
      </Container>
    </>
  );
}

/**
 * Default Dialog Example
 *
 * Demonstrates basic dialog usage with default styling and behavior.
 * Uses props-based API with title, content, and footer.
 */
function DefaultDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">Default Dialog (Controlled)</h3>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors">
        Open Default Dialog
      </button>
      <Dialog
        title="Default Dialog Example"
        content={
          <>
            <p className="text-text-muted">
              This is a default dialog implementation with standard styling. It
              uses the modal variant with medium size, and includes a header
              with a close button, scrollable body, and footer with actions.
            </p>
            <div className="mt-4 space-y-2">
              <p className="font-medium">Features demonstrated:</p>
              <ul className="list-disc list-inside text-text-muted space-y-1">
                <li>Controlled state management</li>
                <li>Modal variant with backdrop</li>
                <li>Focus trap and keyboard navigation</li>
                <li>Click outside to dismiss</li>
                <li>ESC key to close</li>
              </ul>
            </div>
          </>
        }
        footerButtons={[
          {
            clicked: () => setOpen(false),
            className:
              "px-4 py-2 border border-border rounded-lg hover:bg-surface-hover motion-safe:transition-colors",
            buttonContent: "Cancel",
          },
          {
            clicked: () => {
              alert("Confirmed!");
              setOpen(false);
            },
            className:
              "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors",
            buttonContent: "Confirm",
          },
        ]}
        open={open}
        onOpenChange={setOpen}
        variant="modal"
        size="md"
      />
    </div>
  );
}

/**
 * Custom Dialog Example
 *
 * Demonstrates custom styling and behavior:
 * - Custom className overrides
 * - useDialog hook (imperative control)
 * - Custom transition and styling
 */
function CustomDialogExample() {
  const dialog = useDialog();

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">Custom Dialog (useDialog Hook)</h3>
      <button
        type="button"
        onClick={dialog.open}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors">
        Open Custom Dialog
      </button>
      <Dialog
        title="Custom Dialog"
        content={
          <>
            <p className="text-text-muted mb-4">
              This is a custom dialog implementation using the useDialog hook.
              It demonstrates imperative control and custom styling:
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-surface-hover rounded-lg">
                <p className="font-medium text-sm">useDialog Hook</p>
                <p className="text-xs text-text-muted">
                  Imperative control with open(), close(), toggle()
                </p>
              </div>
              <div className="p-3 bg-surface-hover rounded-lg">
                <p className="font-medium text-sm">Large Modal Size</p>
                <p className="text-xs text-text-muted">
                  Uses size="lg" for wider dialog
                </p>
              </div>
              <div className="p-3 bg-surface-hover rounded-lg">
                <p className="font-medium text-sm">Custom Styling</p>
                <p className="text-xs text-text-muted">
                  Override default styles with className prop (shadow-2xl)
                </p>
              </div>
            </div>
          </>
        }
        footerButtons={[
          {
            clicked: dialog.close,
            className:
              "px-4 py-2 border border-border rounded-lg hover:bg-surface-hover motion-safe:transition-colors",
            buttonContent: "Close",
          },
        ]}
        open={dialog.isOpen}
        onOpenChange={(open: boolean) =>
          open ? dialog.open() : dialog.close()
        }
        variant="modal"
        size="lg"
        dismissible={true}
        className="shadow-2xl"
      />
    </div>
  );
}

/**
 * Form Dialog Example
 *
 * Demonstrates:
 * - Form handling within dialog with React Hook Form
 * - Pending state (disables dismissal)
 * - Error handling with Zod validation
 * - Form validation
 */
const formSchema = z.object({
  name: z.string().optional(),
  email: z
    .string()
    .email("Please enter a test valid email address")
    .min(1, "Email is required"),
  age: z.coerce
    .number()
    .int("Age must be an integer")
    .min(0, "Age must be at least 0")
    .max(150, "Age must be at most 150"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
});

type FormData = z.infer<typeof formSchema>;

function FormDialogExample() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      age: 0,
      color: "#000000",
    },
  });

  const handleSubmit = async (data: FormData) => {
    setPending(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert(
        `Form submitted: ${data.name || "N/A"} - ${data.email} - Age: ${data.age} - Color: ${data.color}`
      );
      form.reset();
      setOpen(false);
    } catch (err) {
      throw err; // Let Form component handle the error
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">
        Form Dialog (With React Hook Form)
      </h3>
      <DialogTrigger
        open={open}
        onOpenChange={setOpen}>
        <button
          type="button"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors">
          Open Form Dialog
        </button>
      </DialogTrigger>
      <Dialog
        title="Create New Item"
        content={
          <Form<FormData>
            form={form}
            onSubmit={handleSubmit}>
            <div className="space-y-4">
              <TextInput
                name="name"
                label="Name"
                disabled={pending}
              />
              <TextInput
                name="email"
                label="Email"
                disabled={pending}
                required
              />
              <NumberInput
                name="age"
                label="Age"
                disabled={pending}
                min={0}
                max={150}
                required
              />
              <ColorInput
                name="color"
                label="Color"
                disabled={pending}
              />
              {pending && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Submitting form...
                  </p>
                </div>
              )}
            </div>
          </Form>
        }
        footerButtons={[
          {
            clicked: () => {
              form.reset();
              setOpen(false);
            },
            className: `px-4 py-2 border border-border rounded-lg hover:bg-surface-hover motion-safe:transition-colors ${pending ? "opacity-50 cursor-not-allowed" : ""}`,
            buttonContent: "Cancel",
          },
          {
            clicked: () => {
              form.handleSubmit(handleSubmit)();
            },
            className: `px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors ${pending ? "opacity-50 cursor-not-allowed" : ""}`,
            buttonContent: pending ? "Submitting..." : "Submit",
          },
        ]}
        open={open}
        onOpenChange={setOpen}
        dismissible={!pending}
        variant="modal"
        size="lg"
      />
    </div>
  );
}

/**
 * Select Dropdown Example
 *
 * Demonstrates:
 * - Single and multiple select modes
 * - Placeholder text when nothing is selected
 * - Display of selected items
 * - Checkbox-based selection UI
 */
function SelectDropdownExample() {
  const [singleValue, setSingleValue] = useState<string | undefined>(undefined);
  const [multipleValue, setMultipleValue] = useState<string[]>([]);
  const [isSelected, setIsSelected] = useState(false);

  const options = [
    { value: "current-month", label: "Current month" },
    { value: "next-month", label: "Next month" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-medium text-sm">Single Select Dropdown</h3>
        <p className="text-sm text-text-muted">
          Select a single option. The dropdown closes after selection.
        </p>

        <Checkbox
          checked={isSelected}
          onChange={() => setIsSelected((prev) => !prev)}
        />

        <SelectDropdown
          options={options}
          value={singleValue}
          onChange={(value) => setSingleValue(value as string)}
          placeholder="Select date..."
          multiple={false}
        />
        {singleValue && (
          <p className="text-sm text-text-muted">
            Selected: {options.find((opt) => opt.value === singleValue)?.label}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-sm">Multiple Select Dropdown</h3>
        <p className="text-sm text-text-muted">
          Select multiple options. The dropdown stays open for multiple
          selections.
        </p>
        <SelectDropdown
          options={options}
          value={multipleValue}
          onChange={(value) => setMultipleValue(value as string[])}
          placeholder="Select date..."
          multiple={true}
        />
        {multipleValue.length > 0 && (
          <p className="text-sm text-text-muted">
            Selected:{" "}
            {multipleValue
              .map((val) => options.find((opt) => opt.value === val)?.label)
              .join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
