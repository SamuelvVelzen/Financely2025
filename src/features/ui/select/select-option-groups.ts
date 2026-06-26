import { type ISelectOption } from "./select";

export type ISelectOptionGroup<
  TValue = string,
  TOption extends ISelectOption<TValue> = ISelectOption<TValue>,
> = {
  group: string;
  children: TOption[] | readonly TOption[];
};

export type ISelectOptionsInput<
  TValue = string,
  TOption extends ISelectOption<TValue> = ISelectOption<TValue>,
> =
  | readonly TOption[]
  | TOption[]
  | readonly ISelectOptionGroup<TValue, TOption>[]
  | ISelectOptionGroup<TValue, TOption>[];

function isSelectOptionGroup<
  TValue,
  TOption extends ISelectOption<TValue>,
>(item: unknown): item is ISelectOptionGroup<TValue, TOption> {
  return (
    typeof item === "object" &&
    item !== null &&
    "children" in item &&
    Array.isArray((item as ISelectOptionGroup<TValue, TOption>).children)
  );
}

export function normalizeSelectOptions<
  TOption extends ISelectOption<unknown>,
>(
  options: ISelectOptionsInput<TOption["value"], TOption>,
): ISelectOptionGroup<TOption["value"], TOption>[] {
  if (options.length === 0) {
    return [];
  }

  if (isSelectOptionGroup(options[0])) {
    return options as ISelectOptionGroup<TOption["value"], TOption>[];
  }

  return [
    {
      group: "",
      children: [...(options as TOption[])],
    },
  ];
}

export function flattenSelectOptions<
  TOption extends ISelectOption<unknown>,
>(
  optionGroups:
    | readonly ISelectOptionGroup<TOption["value"], TOption>[]
    | ISelectOptionGroup<TOption["value"], TOption>[],
): TOption[] {
  return optionGroups.flatMap(
    (optionGroup) => [...optionGroup.children] as TOption[],
  );
}

/** Wrap a flat option list as a single unlabeled group. */
export function ungroupedSelectOptions<
  TOption extends ISelectOption<unknown>,
>(
  children: TOption[] | readonly TOption[],
  group = "",
): ISelectOptionGroup<TOption["value"], TOption>[] {
  return [{ group, children: [...children] }];
}
