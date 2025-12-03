export type IPropsWithClassName = { className?: string };

/**
 * Makes all properties of T optional with type `never`.
 * Useful for discriminated unions to exclude properties from one branch.
 *
 * @example
 * type Example =
 *   | { type: 'link'; href: string }
 *   | { type: 'button'; href?: never } & Never<{ href: string }>
 */
export type Never<T> = {
  [K in keyof T]?: never;
};
