"use client";

import { Container } from "@/features/ui/container/container";
import { Dialog } from "@/features/ui/dialog/dialog";
import { DialogTrigger } from "@/features/ui/dialog/dialog-trigger";
import { useDialog } from "@/features/ui/dialog/use-dialog";
import { Title } from "@/features/ui/typography/title";
import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";

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
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
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
              "px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors",
            buttonContent: "Cancel",
          },
          {
            clicked: () => {
              alert("Confirmed!");
              setOpen(false);
            },
            className:
              "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors",
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
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
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
              "px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors",
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
 * - Form handling within dialog
 * - Pending state (disables dismissal)
 * - Error handling
 * - Form validation
 */
function FormDialogExample() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simple validation
      if (!formData.name.trim() || !formData.email.trim()) {
        throw new Error("Please fill in all fields");
      }

      alert(`Form submitted: ${formData.name} - ${formData.email}`);
      setFormData({ name: "", email: "" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">Form Dialog (With Validation)</h3>
      <DialogTrigger
        open={open}
        onOpenChange={setOpen}>
        <button
          type="button"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
          Open Form Dialog
        </button>
      </DialogTrigger>
      <Dialog
        title="Create New Item"
        content={
          <form
            ref={formRef}
            onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="form-name"
                  className="block text-sm font-medium mb-1">
                  Name
                </label>
                <input
                  id="form-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={pending}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="form-email"
                  className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="form-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={pending}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  required
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}
              {pending && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Submitting form...
                  </p>
                </div>
              )}
            </div>
          </form>
        }
        footerButtons={[
          {
            clicked: () => setOpen(false),
            className: `px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors ${pending ? "opacity-50 cursor-not-allowed" : ""}`,
            buttonContent: "Cancel",
          },
          {
            clicked: () => {
              formRef.current?.requestSubmit();
            },
            className: `px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors ${pending ? "opacity-50 cursor-not-allowed" : ""}`,
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
