"use client";

import { Button } from "@/features/ui/button/button";
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
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const Route = createFileRoute("/(app)/")({
  component: Home,
  head: () => ({
    meta: [
      {
        title: "Dashboard | Financely",
      },
    ],
  }),
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
        <h2 className="text-lg font-semibold mb-4">Toast Examples</h2>
        <ToastExample />
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
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors"
      >
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
            buttonContent: "Cancel",
          },
          {
            clicked: () => {
              alert("Confirmed!");
              setOpen(false);
            },
            variant: "primary",
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
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors"
      >
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
      <DialogTrigger open={open} onOpenChange={setOpen}>
        Open Form Dialog
      </DialogTrigger>
      <Dialog
        title="Create New Item"
        content={
          <Form<FormData> form={form} onSubmit={handleSubmit}>
            <div className="space-y-4">
              <TextInput name="name" label="Name" disabled={pending} />
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
              <ColorInput name="color" label="Color" disabled={pending} />
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
            disabled: pending,
            clicked: () => {
              form.reset();
              setOpen(false);
            },
            buttonContent: "Cancel",
          },
          {
            disabled: pending,
            clicked: () => {
              form.handleSubmit(handleSubmit)();
            },
            variant: "primary",
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
type ISelectDropdownFormData = {
  singleValue: string | undefined;
  multipleValue: string[];
};

function SelectDropdownExample() {
  const [isSelected, setIsSelected] = useState(false);
  const form = useForm<ISelectDropdownFormData>({
    defaultValues: {
      singleValue: undefined,
      multipleValue: [],
    },
  });

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

        <Form form={form} onSubmit={() => {}}>
          <SelectDropdown
            name="singleValue"
            options={options}
            placeholder="Select date..."
            multiple={false}
          />
        </Form>
        {form.watch("singleValue") && (
          <p className="text-sm text-text-muted">
            Selected:{" "}
            {
              options.find((opt) => opt.value === form.watch("singleValue"))
                ?.label
            }
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-sm">Multiple Select Dropdown</h3>
        <p className="text-sm text-text-muted">
          Select multiple options. The dropdown stays open for multiple
          selections.
        </p>
        <Form form={form} onSubmit={() => {}}>
          <SelectDropdown
            name="multipleValue"
            options={options}
            placeholder="Select date..."
            multiple={true}
          />
        </Form>
        {(form.watch("multipleValue") || []).length > 0 && (
          <p className="text-sm text-text-muted">
            Selected:{" "}
            {(form.watch("multipleValue") || [])
              .map((val) => options.find((opt) => opt.value === val)?.label)
              .join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Toast Example
 *
 * Demonstrates:
 * - Different toast variants (success, error, info, warning)
 * - Custom duration
 * - Manual dismiss (duration: 0)
 * - Hover to pause auto-dismiss
 * - Close button
 * - Different positions
 */
function ToastExample() {
  const toast = useToast();

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Click the buttons below to trigger different toast notifications. Hover
        over a toast to pause its timer. Click the X button to dismiss
        immediately.
      </p>

      <h4 className="font-medium text-sm">Variants</h4>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="success"
          clicked={() => toast.success("Transaction saved successfully!")}
        >
          Success Toast
        </Button>

        <Button
          variant="danger"
          clicked={() => toast.error("Failed to delete item")}
        >
          Error Toast
        </Button>

        <Button
          variant="info"
          clicked={() =>
            toast.info("Info", "Your data is being synced", {
              duration: 5000,
            })
          }
        >
          Info Toast (5s)
        </Button>

        <Button
          variant="warning"
          clicked={() => toast.warning("Warning", "Your session will expire soon")}
        >
          Warning Toast
        </Button>
      </div>

      <h4 className="font-medium text-sm">Options</h4>
      <div className="flex flex-wrap gap-2">
        <Button
          clicked={() =>
            toast.info("Persistent Toast", "This toast won't auto-dismiss. Click X to close.", {
              duration: 0,
            })
          }
        >
          No Auto-Dismiss
        </Button>

        <Button
          clicked={() =>
            toast.success("Minimal toast", {
              showCloseButton: false,
              duration: 2000,
            })
          }
        >
          No Close Button (2s)
        </Button>

        <Button variant="danger" clicked={() => toast.clearAll()}>
          Clear All Toasts
        </Button>
      </div>

      <h4 className="font-medium text-sm">Positions</h4>
      <div className="flex flex-wrap gap-2">
        <Button
          clicked={() => toast.info("Info", "Top left toast", { position: "top-left" })}
        >
          Top Left
        </Button>

        <Button
          clicked={() =>
            toast.info("Info", "Top center toast", { position: "top-center" })
          }
        >
          Top Center
        </Button>

        <Button
          clicked={() =>
            toast.info("Info", "Top right toast", { position: "top-right" })
          }
        >
          Top Right
        </Button>

        <Button
          clicked={() =>
            toast.info("Info", "Bottom left toast", { position: "bottom-left" })
          }
        >
          Bottom Left
        </Button>

        <Button
          clicked={() =>
            toast.info("Info", "Bottom center toast", { position: "bottom-center" })
          }
        >
          Bottom Center
        </Button>

        <Button
          clicked={() =>
            toast.info("Info", "Bottom right toast (default)", {
              position: "bottom-right",
            })
          }
        >
          Bottom Right
        </Button>
      </div>
    </div>
  );
}
