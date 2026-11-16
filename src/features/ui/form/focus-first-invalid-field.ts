import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

type IFocusFirstInvalidFieldOptions = {
  /** When set, focus follows visual field order inside the form element. */
  formElementId?: string;
};

/**
 * Moves focus to the first invalid control after validation.
 * Prefers DOM order (aria-invalid) so focus matches what the user sees.
 */
export function focusFirstInvalidField<T extends FieldValues>(
  form: UseFormReturn<T>,
  options?: IFocusFirstInvalidFieldOptions,
): void {
  const focusFromErrorState = () => {
    const fields = Object.keys(form.formState.errors) as Path<T>[];
    for (const name of fields) {
      if (form.getFieldState(name).invalid) {
        void form.setFocus(name);
        return;
      }
    }
  };

  const formElementId = options?.formElementId;
  if (!formElementId) {
    focusFromErrorState();
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const formEl = document.getElementById(formElementId);
      const firstInvalid = formEl?.querySelector<HTMLElement>(
        "[aria-invalid='true']",
      );
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      focusFromErrorState();
    });
  });
}
