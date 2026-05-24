/**
 * Shared ids and aria-describedby for labeled form fields (input, textarea, select).
 */
export function getFieldDescriptionIds(inputId: string) {
  return {
    errorId: `${inputId}-error`,
    hintId: `${inputId}-hint`,
  };
}

export function getFieldAriaDescribedBy(options: {
  showError: boolean;
  errorId: string;
  hint?: string;
  hintId: string;
}): string | undefined {
  const ids: string[] = [];
  if (options.showError) {
    ids.push(options.errorId);
  } else if (options.hint) {
    ids.push(options.hintId);
  }
  return ids.length > 0 ? ids.join(" ") : undefined;
}
