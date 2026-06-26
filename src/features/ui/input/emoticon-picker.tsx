import {
  type IFormOrControlledMode,
} from "@/features/shared/hooks/use-form-context-optional";
import type { ITransactionType } from "@/features/shared/validation/schemas";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { useFieldAdapter } from "@/features/shared/hooks/use-field-adapter";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { NativeEmoticonInput } from "@/features/ui/input/native-emoticon-input";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { HiEmojiHappy } from "react-icons/hi";
import { HiChevronDown, HiMagnifyingGlass } from "react-icons/hi2";
import {
  DEFAULT_EMOJI_CATEGORY,
  EMOJI_CATEGORIES,
  extractFirstEmoji,
  getSuggestedEmojis,
  normalizeEmoticon,
  searchEmojiCatalog,
  type IEmojiCatalogEntry,
} from "./emoticon-picker-data";

type IEmoticonPickerProps = IPropsWithClassName & {
  disabled?: boolean;
  transactionType?: ITransactionType;
  variant?: "compact" | "standalone";
  /** Hide outer border (e.g. when embedded in a combined input). */
  embedded?: boolean;
  onOpenChange?: (open: boolean) => void;
  "aria-label"?: string;
} & IFormOrControlledMode<string>;

export function EmoticonPicker({
  className,
  name,
  disabled,
  transactionType,
  variant = "standalone",
  embedded = false,
  onOpenChange,
  "aria-label": ariaLabel = "Choose tag icon",
  value: controlledValue,
  onChange: controlledOnChange,
  onValueChange,
}: IEmoticonPickerProps) {
  const generatedId = useId();
  const pickerSearchId = `${generatedId}-emoticon-picker-search`;
  const isCompact = variant === "compact";
  const { isMobile } = useResponsive();

  const { field, borderClass, renderWithController } = useFieldAdapter({
    name,
    value: controlledValue,
    onChange: controlledOnChange,
    onValueChange,
  });

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EMOJI_CATEGORY);
  const [pickerSearch, setPickerSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const pickerSearchRef = useRef<HTMLInputElement>(null);

  const selectedEmoji = useMemo(
    () => normalizeEmoticon(String(field.value || "")),
    [field.value],
  );

  useEffect(() => {
    const raw = String(field.value || "");
    const normalized = normalizeEmoticon(raw);
    if (raw !== normalized) {
      field.onChange(normalized);
    }
  }, [field.onChange, field.value]);

  const suggestedEmojis = useMemo(
    () => getSuggestedEmojis(transactionType),
    [transactionType],
  );

  const searchResults = useMemo(
    () => searchEmojiCatalog(pickerSearch),
    [pickerSearch],
  );

  const isSearchActive = pickerSearch.trim().length > 0;

  const visibleEmojis = useMemo(() => {
    if (isSearchActive) {
      return searchResults;
    }

    const categoryEmojis = EMOJI_CATEGORIES[selectedCategory] ?? [];
    return categoryEmojis.map((emoji) => ({
      emoji,
      label: emoji,
      keywords: [],
      categories: [selectedCategory],
    })) satisfies IEmojiCatalogEntry[];
  }, [isSearchActive, searchResults, selectedCategory]);

  useEffect(() => {
    if (!isPickerOpen) {
      setPickerSearch("");
      setSelectedCategory(DEFAULT_EMOJI_CATEGORY);
      setHighlightedIndex(0);
      return;
    }

    requestAnimationFrame(() => {
      pickerSearchRef.current?.focus();
    });
  }, [isPickerOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [pickerSearch, selectedCategory, isSearchActive]);

  const handleEmojiSelect = (
    emoji: string,
    onChange: (value: string) => void,
  ) => {
    onChange(normalizeEmoticon(emoji));
    setIsPickerOpen(false);
  };

  const handleClear = (onChange: (value: string) => void) => {
    onChange("");
    setIsPickerOpen(false);
  };

  const handlePickerSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    onChange: (value: string) => void,
  ) => {
    if (visibleEmojis.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        index + 1 >= visibleEmojis.length ? 0 : index + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        index - 1 < 0 ? visibleEmojis.length - 1 : index - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const entry = visibleEmojis[highlightedIndex];
      if (entry) {
        handleEmojiSelect(entry.emoji, onChange);
      }
    }
  };

  const renderEmojiButton = (
    entry: IEmojiCatalogEntry | { emoji: string; label: string },
    index: number,
    onChange: (value: string) => void,
    key: string,
  ) => {
    const isHighlighted = isSearchActive && index === highlightedIndex;

    return (
      <button
        key={key}
        type="button"
        onClick={() => handleEmojiSelect(entry.emoji, onChange)}
        onMouseEnter={() => setHighlightedIndex(index)}
        className={cn(
          "p-2 rounded-lg hover:bg-surface-hover text-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isHighlighted && "bg-surface-hover ring-2 ring-primary",
        )}
        aria-label={`Select ${entry.label}`}
        title={entry.label}>
        {entry.emoji}
      </button>
    );
  };

  const renderPicker = (currentField: typeof field) => {
    if (isMobile) {
      return (
        <NativeEmoticonInput
          value={String(currentField.value || "")}
          onChange={currentField.onChange}
          onBlur={currentField.onBlur}
          disabled={disabled}
          isCompact={isCompact}
          embedded={embedded}
          borderClass={borderClass}
          className={className}
          aria-label={ariaLabel}
        />
      );
    }

    const previewEmoji = extractFirstEmoji(String(currentField.value || ""));

    const triggerContent = isCompact ? (
      <span
        className="flex items-center justify-center gap-0.5 px-2.5"
        aria-label={ariaLabel}>
        {previewEmoji ? (
          <span
            className="text-lg leading-none"
            aria-hidden>
            {previewEmoji}
          </span>
        ) : (
          <HiEmojiHappy
            className="size-4 text-text-muted"
            aria-hidden
          />
        )}
        <HiChevronDown
          className="size-3 text-text-muted"
          aria-hidden
        />
      </span>
    ) : (
      <span className="flex w-full items-center gap-2 px-3 py-2 text-left">
        {previewEmoji ? (
          <span
            className="text-xl shrink-0"
            aria-hidden>
            {previewEmoji}
          </span>
        ) : (
          <HiEmojiHappy className="size-5 shrink-0 text-text-muted" />
        )}
        <span
          className={cn(
            "flex-1 truncate text-sm",
            previewEmoji ? "text-text" : "text-text-muted",
          )}>
          {previewEmoji ? "Icon selected" : "Choose an icon"}
        </span>
        <HiChevronDown className="size-4 shrink-0 text-text-muted" />
      </span>
    );

    return (
      <div
        className={cn(
          "shrink-0",
          embedded &&
            "flex self-stretch [&_[data-dropdown-trigger]]:flex [&_[data-dropdown-trigger]]:h-full [&_[data-dropdown-trigger]]:min-h-0",
          className,
        )}>
        <Dropdown
          dropdownSelector={triggerContent}
          open={isPickerOpen}
          onOpenChange={(open) => {
            setIsPickerOpen(open);
            onOpenChange?.(open);
          }}
          placement="bottom"
          closeOnItemClick={false}
          disabled={disabled}
          selectorClassName={cn(
            "!justify-start bg-surface hover:bg-surface-hover",
            isCompact
              ? cn(
                  "!w-auto border-0 rounded-none rounded-l-2xl",
                  embedded
                    ? "!h-full !min-h-0 !py-0 !px-0 focus:ring-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    : "!min-h-9 !h-9 !px-0",
                )
              : "!justify-start border border-border rounded-2xl",
            !embedded && !isCompact && borderClass,
            embedded && isPickerOpen && "ring-2 ring-inset ring-primary",
          )}>
          <Dropdown.Panel className="overflow-hidden w-[min(100vw-2rem,360px)] p-0">
            <div className="border-b border-border p-2">
              <div className="relative">
                <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <input
                  ref={pickerSearchRef}
                  id={pickerSearchId}
                  type="search"
                  value={pickerSearch}
                  onChange={(event) => setPickerSearch(event.target.value)}
                  onKeyDown={(event) =>
                    handlePickerSearchKeyDown(event, currentField.onChange)
                  }
                  placeholder="Search icons, e.g. food, car, money"
                  className="h-9 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Search emoji icons"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto p-3 space-y-3">
              {selectedEmoji && (
                <button
                  type="button"
                  onClick={() => handleClear(currentField.onChange)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  Remove icon
                </button>
              )}

              {isSearchActive ? (
                visibleEmojis.length > 0 ? (
                  <div
                    className="grid grid-cols-8 gap-1"
                    role="listbox"
                    aria-label="Search results">
                    {visibleEmojis.map((entry, index) =>
                      renderEmojiButton(
                        entry,
                        index,
                        currentField.onChange,
                        `search-${entry.emoji}-${index}`,
                      ),
                    )}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-text-muted">
                    No icons match your search
                  </p>
                )
              ) : (
                <>
                  {suggestedEmojis.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                        Suggested
                      </p>
                      <div className="grid grid-cols-8 gap-1">
                        {suggestedEmojis.map((entry) =>
                          renderEmojiButton(
                            entry,
                            0,
                            currentField.onChange,
                            `suggested-${entry.emoji}`,
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border-b border-border overflow-x-auto scrollbar-hide -mx-3 px-3">
                    <div
                      className="flex min-w-max"
                      role="tablist"
                      aria-label="Emoji categories">
                      {Object.keys(EMOJI_CATEGORIES).map((category) => {
                        const isActive = selectedCategory === category;

                        return (
                          <button
                            key={category}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setSelectedCategory(category)}
                            className={cn(
                              "px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2",
                              isActive
                                ? "border-primary text-text bg-surface"
                                : "border-transparent text-text-muted hover:text-text hover:border-border",
                            )}>
                            {category}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-8 gap-1"
                    role="tabpanel"
                    aria-label={selectedCategory}>
                    {visibleEmojis.map((entry, index) =>
                      renderEmojiButton(
                        entry,
                        index,
                        currentField.onChange,
                        `${selectedCategory}-${entry.emoji}-${index}`,
                      ),
                    )}
                  </div>
                </>
              )}
            </div>
          </Dropdown.Panel>
        </Dropdown>
      </div>
    );
  };

  return renderWithController((currentField) => renderPicker(currentField));
}
