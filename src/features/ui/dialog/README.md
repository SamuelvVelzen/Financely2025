# Dialog Component System

A comprehensive, accessible dialog system built with React 19, TypeScript, and Tailwind CSS. Supports multiple variants, controlled/uncontrolled modes, full accessibility, and props-based API.

## Features

- ✅ Controlled and uncontrolled modes
- ✅ Multiple variants: modal, fullscreen
- ✅ Full accessibility (ARIA, focus trap, keyboard navigation)
- ✅ SSR-safe portal rendering
- ✅ Configurable animations with motion preference support
- ✅ Scroll lock when open
- ✅ Focus restoration
- ✅ Dark mode support
- ✅ Props-based API (title, content, footerButtons)

## Installation

The dialog system is already available in `src/features/ui/dialog/`. Import components as needed:

```tsx
import { Dialog, DialogTrigger, useDialog } from "@/features/ui/dialog";
```

## Basic Usage

### Controlled Dialog

```tsx
import { useState } from "react";
import { Dialog } from "@/features/ui/dialog";
import Button from "@/features/ui/button/button";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <Dialog
        title="Dialog Title"
        content="This is the dialog content. It can contain any React elements."
        footerButtons={[
          {
            clicked: () => setOpen(false),
            className: "px-4 py-2 border border-border rounded-lg",
            buttonContent: "Close",
          },
        ]}
        open={open}
        onOpenChange={setOpen}
        variant="modal"
        size="md"
      />
    </>
  );
}
```

### Uncontrolled Dialog

```tsx
import { Dialog, useDialog } from "@/features/ui/dialog";
import Button from "@/features/ui/button/button";

function MyComponent() {
  const dialog = useDialog();

  return (
    <>
      <button onClick={dialog.open}>Open Dialog</button>
      <Dialog
        title="Uncontrolled Dialog"
        content="Uncontrolled dialog content"
        footerButtons={[
          {
            clicked: dialog.close,
            className: "px-4 py-2 border border-border rounded-lg",
            buttonContent: "Close",
          },
        ]}
        open={dialog.isOpen}
        onOpenChange={(open) => (open ? dialog.open() : dialog.close())}
      />
    </>
  );
}
```

### Using DialogTrigger

```tsx
import { useState } from "react";
import { Dialog, DialogTrigger } from "@/features/ui/dialog";
import Button from "@/features/ui/button/button";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DialogTrigger
        open={open}
        onOpenChange={setOpen}>
        <button>Open Dialog</button>
      </DialogTrigger>
      <Dialog
        title="Dialog Title"
        content="Content"
        footerButtons={[
          {
            clicked: () => setOpen(false),
            className: "px-4 py-2 border border-border rounded-lg",
            buttonContent: "Close",
          },
        ]}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
```

## API Reference

### Dialog Props

| Prop                  | Type                                     | Default         | Description                                                             |
| --------------------- | ---------------------------------------- | --------------- | ----------------------------------------------------------------------- |
| `open`                | `boolean`                                | `undefined`     | Controlled open state. If undefined, uses internal state (uncontrolled) |
| `onOpenChange`        | `(open: boolean) => void`                | -               | Callback when open state changes                                        |
| `dismissible`         | `boolean`                                | `true`          | Whether dialog can be dismissed (overlay click, Esc key)                |
| `portal`              | `boolean`                                | `true`          | Whether to render in a portal                                           |
| `portalContainer`     | `HTMLElement`                            | `document.body` | Portal container element                                                |
| `keepMounted`         | `boolean`                                | `false`         | Keep dialog mounted when closed (for animations)                        |
| `variant`             | `"modal" \| "fullscreen"`                | `"modal"`       | Dialog variant                                                          |
| `size`                | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"`          | Dialog size (for modal variant)                                         |
| `transitionClassName` | `string`                                 | -               | Custom transition className                                             |
| `aria-label`          | `string`                                 | -               | ARIA label for dialog                                                   |
| `aria-labelledby`     | `string`                                 | -               | ARIA labelled by element id                                             |
| `className`           | `string`                                 | -               | Additional CSS classes                                                  |
| `style`               | `React.CSSProperties`                    | -               | Inline styles                                                           |
| `title`               | `string`                                 | -               | Title for header (always rendered)                                      |
| `content`             | `string \| React.ReactNode`              | -               | Content for body. If not provided, children will be used                |
| `footerButtons`       | `IButtonProps[]`                         | -               | Footer buttons (array of button props). Always rendered                 |
| `scrollable`          | `boolean`                                | `true`          | Whether body content is scrollable                                      |
| `onOpen`              | `() => void`                             | -               | Called when dialog opens                                                |
| `onClose`             | `() => void`                             | -               | Called when dialog closes                                               |
| `onAfterOpen`         | `() => void`                             | -               | Called after dialog opens (after animation)                             |
| `onAfterClose`        | `() => void`                             | -               | Called after dialog closes (after animation)                            |

### Dialog Variants

#### Modal

Centered dialog with backdrop. Suitable for confirmations, forms, and general content.

```tsx
<Dialog
  title="Modal Dialog"
  content="Modal content"
  footerButtons={[
    {
      clicked: () => setOpen(false),
      className: "px-4 py-2 border border-border rounded-lg",
      buttonContent: "Close",
    },
  ]}
  variant="modal"
  size="md"
/>
```

Sizes: `sm`, `md`, `lg`, `xl`, `full`

#### Fullscreen

Full viewport dialog. Useful for immersive experiences.

```tsx
<Dialog
  title="Fullscreen Dialog"
  content="Fullscreen content"
  footerButtons={[]}
  variant="fullscreen"
/>
```

### Button Props (for footerButtons)

The `footerButtons` prop accepts an array of `IButtonProps` objects:

```tsx
type IButtonProps = {
  clicked: () => void;
  buttonContent: string | React.ReactNode;
  className?: string;
};
```

## useDialog Hook

Imperative hook for dialog control.

```tsx
const dialog = useDialog();
// or with controlled props
const dialog = useDialog({ open, onOpenChange });

// Methods
dialog.open(); // Open dialog
dialog.close(); // Close dialog
dialog.toggle(); // Toggle open state
dialog.isOpen; // Current open state
```

## Examples

### Confirmation Dialog

```tsx
import { useState } from "react";
import { Dialog } from "@/features/ui/dialog";

function ConfirmDialog({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Delete</button>
      <Dialog
        title="Confirm Deletion"
        content="Are you sure you want to delete this item? This action cannot be undone."
        footerButtons={[
          {
            clicked: () => setOpen(false),
            className:
              "px-4 py-2 border border-border rounded-lg hover:bg-surface-hover",
            buttonContent: "Cancel",
          },
          {
            clicked: () => {
              onConfirm();
              setOpen(false);
            },
            className:
              "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover",
            buttonContent: "Delete",
          },
        ]}
        open={open}
        onOpenChange={setOpen}
        variant="modal"
        size="sm"
      />
    </>
  );
}
```

### Form Dialog

```tsx
import { useState, useRef } from "react";
import { Dialog } from "@/features/ui/dialog";

function FormDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOpen(false);
    } catch (err) {
      setError("Failed to submit form");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Form</button>
      <Dialog
        title="Create Item"
        content={
          <form
            ref={formRef}
            onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded"
                  required
                />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
            </div>
          </form>
        }
        footerButtons={[
          {
            clicked: () => setOpen(false),
            className: "px-4 py-2 border border-border rounded-lg",
            buttonContent: "Cancel",
            disabled: pending,
          },
          {
            clicked: () => formRef.current?.requestSubmit(),
            className: "px-4 py-2 bg-primary text-white rounded-lg",
            buttonContent: pending ? "Saving..." : "Save",
            disabled: pending,
          },
        ]}
        open={open}
        onOpenChange={setOpen}
        dismissible={!pending}
        variant="modal"
        size="lg"
      />
    </>
  );
}
```

### Custom Content

```tsx
<Dialog
  title="Custom Dialog"
  content={
    <div className="space-y-4">
      <p>Custom React content</p>
      <input
        type="text"
        placeholder="Enter something"
      />
      <p>More content here</p>
    </div>
  }
  footerButtons={[
    {
      clicked: () => setOpen(false),
      className: "px-4 py-2 border border-border rounded-lg",
      buttonContent: "Close",
    },
  ]}
/>
```

## Customization

### Custom Animations

Use the `transitionClassName` prop to override default animations:

```tsx
<Dialog
  title="Custom Dialog"
  content="Content"
  footerButtons={[]}
  transitionClassName="transition-all duration-500 ease-in-out"
  className="custom-dialog"
/>
```

### Styling with Data Attributes

The dialog exposes data attributes for styling:

```css
/* Target dialog state */
[data-state="open"] {
  /* ... */
}
[data-state="closed"] {
  /* ... */
}

/* Target variant */
[data-variant="modal"] {
  /* ... */
}
[data-variant="fullscreen"] {
  /* ... */
}

/* Target size (modal only) */
[data-size="sm"] {
  /* ... */
}
[data-size="md"] {
  /* ... */
}
```

### Dark Mode

The dialog automatically uses your theme's design tokens. Dark mode is supported via the `.dark` class on the root element:

```tsx
// Dialog styles automatically adapt
<Dialog
  title="Dialog"
  content="Adapts to dark mode"
  footerButtons={[]}
  variant="modal"
/>
```

## Accessibility

The dialog system includes:

- **ARIA attributes**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-label`
- **Focus trap**: Focus is trapped within the dialog when open
- **Keyboard navigation**:
  - `Esc` key closes the dialog
  - `Tab` / `Shift+Tab` cycles through focusable elements
- **Focus restoration**: Returns focus to the trigger element when closed
- **Motion preferences**: All animations respect `prefers-reduced-motion`
- **Header always present**: Title is always rendered for accessibility

## Best Practices

1. **Always provide a title**: The `title` prop is required for accessibility
2. **Handle dismissible state**: Use `dismissible={false}` for critical actions
3. **Prevent accidental closes**: Disable dismissal when forms are pending
4. **Use footerButtons**: Always provide footer buttons for user actions
5. **Restore focus**: Use `DialogTrigger` or manually restore focus on close
6. **Form submission**: Use refs to access form elements for submission from footer buttons

## TypeScript

All components are fully typed. Import types as needed:

```tsx
import type {
  DialogProps,
  DialogVariant,
  DialogSize,
  UseDialogReturn,
} from "@/features/ui/dialog";
import type { IButtonProps } from "@/features/ui/button/button";
```

## SSR Safety

The dialog system is SSR-safe:

- Portal rendering is deferred until client hydration
- All `document`/`window` access is guarded
- No hydration mismatches

## Performance

- Content is unmounted when closed (unless `keepMounted={true}`)
- Scrollbar compensation prevents layout shift
- Animations use CSS transitions for smooth performance
