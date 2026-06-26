import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useRef } from "react";
import { HiEmojiHappy } from "react-icons/hi";
import { extractFirstEmoji, normalizeEmoticon } from "./emoticon-picker-data";

type INativeEmoticonInputProps = IPropsWithClassName & {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  isCompact?: boolean;
  embedded?: boolean;
  borderClass?: string;
  "aria-label"?: string;
};

export function NativeEmoticonInput({
  value,
  onChange,
  onBlur,
  disabled,
  isCompact = false,
  embedded = false,
  borderClass,
  className,
  "aria-label": ariaLabel = "Choose tag icon",
}: INativeEmoticonInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewEmoji = extractFirstEmoji(value);
  const displayValue = String(value || "");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;

    if (next === "") {
      onChange("");
      return;
    }

    const normalized = normalizeEmoticon(next);
    if (!normalized) {
      return;
    }

    onChange(normalized);
    requestAnimationFrame(() => {
      inputRef.current?.blur();
    });
  };

  return (
    <label
      className={cn(
        "relative flex shrink-0 cursor-pointer items-center",
        isCompact
          ? cn(
              "self-stretch px-2.5",
              embedded &&
                "flex items-center rounded-l-2xl hover:bg-surface-hover has-focus-visible:ring-2 has-focus-visible:ring-inset has-focus-visible:ring-primary",
            )
          : cn(
              "h-9 w-full gap-2 rounded-2xl border px-3 py-2",
              borderClass ?? "border-border",
            ),
        disabled && "cursor-not-allowed",
        className,
      )}>
      <span
        className={cn(
          "pointer-events-none flex items-center",
          isCompact ? "gap-0.5" : "w-full gap-2",
        )}
        aria-hidden>
        {previewEmoji ? (
          <span className={cn(isCompact ? "text-lg leading-none" : "text-xl")}>
            {previewEmoji}
          </span>
        ) : (
          <HiEmojiHappy
            className={cn(
              "text-text-muted",
              isCompact ? "size-4" : "size-5",
            )}
          />
        )}
        {!isCompact && (
          <span
            className={cn(
              "flex-1 truncate text-sm",
              previewEmoji ? "text-text" : "text-text-muted",
            )}>
            {previewEmoji ? "Icon selected" : "Choose an icon"}
          </span>
        )}
      </span>

      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        enterKeyHint="done"
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        onBlur={onBlur}
        aria-label={ariaLabel}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="absolute inset-0 size-full cursor-pointer border-0 bg-transparent p-0 text-base opacity-0 outline-none"
      />
    </label>
  );
}
