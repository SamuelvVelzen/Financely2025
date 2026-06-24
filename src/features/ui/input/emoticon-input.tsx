import {
  type IFormOrControlledMode,
} from "@/features/shared/hooks/use-form-context-optional";
import { useFieldAdapter } from "@/features/shared/hooks/use-field-adapter";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useEffect, useId, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { HiEmojiHappy } from "react-icons/hi";

// Emoji shortcode mapping for autocomplete
const EMOJI_SHORTCODES: Record<string, string> = {
  ":smile:": "😊",
  ":grinning:": "😀",
  ":laughing:": "😂",
  ":heart:": "❤️",
  ":thumbsup:": "👍",
  ":thumbsdown:": "👎",
  ":fire:": "🔥",
  ":star:": "⭐",
  ":money:": "💰",
  ":food:": "🍔",
  ":car:": "🚗",
  ":shopping:": "🛍️",
  ":movie:": "🎬",
  ":lightbulb:": "💡",
  ":hospital:": "🏥",
  ":savings:": "💾",
  ":package:": "📦",
  ":pizza:": "🍕",
  ":coffee:": "☕",
  ":beer:": "🍺",
  ":wine:": "🍷",
  ":airplane:": "✈️",
  ":train:": "🚂",
  ":bike:": "🚲",
  ":house:": "🏠",
  ":gift:": "🎁",
  ":party:": "🎉",
  ":birthday:": "🎂",
  ":sports:": "⚽",
  ":music:": "🎵",
  ":book:": "📚",
  ":computer:": "💻",
  ":phone:": "📱",
  ":creditcard:": "💳",
  ":bank:": "🏦",
  ":shoppingcart:": "🛒",
  ":restaurant:": "🍽️",
  ":gas:": "⛽",
  ":wrench:": "🔧",
  ":pill:": "💊",
  ":gym:": "💪",
  ":sun:": "☀️",
  ":rain:": "🌧️",
  ":snow:": "❄️",
};

// Common emojis organized by category
const EMOJI_CATEGORIES = {
  "Smileys & People": [
    "😀",
    "😊",
    "😍",
    "🤗",
    "😎",
    "🥳",
    "😴",
    "🤔",
    "😮",
    "😢",
  ],
  "Food & Drink": [
    "🍔",
    "🍕",
    "🍟",
    "🌮",
    "🍰",
    "🍎",
    "🍌",
    "🍇",
    "☕",
    "🍺",
    "🍷",
    "🥤",
  ],
  "Travel & Places": ["🚗", "✈️", "🚂", "🚲", "🏠", "🏖️", "🗽", "🌍", "🗺️"],
  Activities: ["⚽", "🎮", "🎬", "🎵", "🎨", "📚", "🎯", "🎪", "🎭"],
  Objects: ["💻", "📱", "💳", "🔑", "⌚", "📺", "📷", "🎁", "💡", "🔧"],
  Symbols: ["❤️", "⭐", "🔥", "💯", "✅", "❌", "⚠️", "💡", "🎯"],
  "Money & Finance": ["💰", "💵", "💴", "💶", "💷", "💳", "🏦", "📊", "📈"],
  Shopping: ["🛍️", "🛒", "🛒", "💼", "👔", "👗", "👠", "👜"],
  "Health & Medical": ["🏥", "💊", "🩺", "🚑", "💉", "🦷", "👁️"],
  Other: ["📦", "💾", "🔒", "🔓", "⭐", "🎉", "🎊", "🎈"],
};

type IEmoticonInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "name" | "type" | "value" | "onChange"
> &
  IPropsWithClassName & {
    label?: string;
    hint?: string;
    required?: boolean;
    id?: string;
  } & IFormOrControlledMode<string>;

export function EmoticonInput({
  className,
  label,
  hint,
  required,
  name,
  id,
  disabled,
  value: controlledValue,
  onChange: controlledOnChange,
  onValueChange,
  ...props
}: IEmoticonInputProps) {
  const generatedId = useId();
  const inputId = id || `${generatedId}-text-input`;
  const pickerButtonId = `${generatedId}-picker-button`;
  
  const { field, borderClass, shouldShowError, error, renderWithController } = useFieldAdapter({
    name,
    value: controlledValue,
    onChange: controlledOnChange,
    onValueChange,
  });

  // Initialize text value
  const [textValue, setTextValue] = useState<string>(() => {
    return String(field.value || "");
  });

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    Object.keys(EMOJI_CATEGORIES)[0]
  );
  const [autocompleteMatches, setAutocompleteMatches] = useState<
    Array<{ shortcode: string; emoji: string }>
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const baseClasses =
    "w-full px-3 py-2 border rounded-2xl bg-surface text-text hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
  const widthBaseClasses = `h-9`;

  // Helper to update value
  const updateValue = (newValue: string) => {
    setTextValue(newValue);
    field.onChange(newValue);
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !autocompleteRef.current?.contains(event.target as Node)
      ) {
        setIsAutocompleteOpen(false);
      }
    };

    if (isAutocompleteOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isAutocompleteOpen]);

  // Detect :shortcode: pattern and show autocomplete
  useEffect(() => {
    const match = textValue.match(/:([a-z0-9_]+):?$/i);
    if (match && !disabled) {
      const query = match[1].toLowerCase();
      const matches = Object.entries(EMOJI_SHORTCODES)
        .filter(([shortcode]) =>
          shortcode.slice(1, -1).toLowerCase().startsWith(query)
        )
        .slice(0, 8)
        .map(([shortcode, emoji]) => ({ shortcode, emoji }));
      setAutocompleteMatches(matches);
      setIsAutocompleteOpen(matches.length > 0);
    } else {
      setIsAutocompleteOpen(false);
      setAutocompleteMatches([]);
    }
  }, [textValue, disabled]);

  // Handle autocomplete selection
  const handleAutocompleteSelect = (shortcode: string, emoji: string) => {
    const match = textValue.match(/(.*):([a-z0-9_]+):?$/i);
    if (match) {
      const newValue = match[1] + emoji;
      updateValue(newValue);
      setIsAutocompleteOpen(false);
      inputRef.current?.focus();
    }
  };

  // Handle emoji picker selection
  const handleEmojiSelect = (emoji: string) => {
    const currentValue = textValue || "";
    const newValue = currentValue + emoji;
    updateValue(newValue);
    setIsPickerOpen(false);
    inputRef.current?.focus();
  };

  // Shared rendering logic
  const renderEmoticonInput = (currentField: typeof field) => {
    const currentValue = String(currentField.value || "");
    // Sync text value when value changes from outside
    if (currentValue !== textValue && document.activeElement?.id !== inputId) {
      setTextValue(currentValue);
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setTextValue(inputValue);
      currentField.onChange(inputValue);
    };

    const handleTextBlur = () => {
      currentField.onChange(textValue || "");
      currentField.onBlur();
      // Delay closing autocomplete to allow for clicks
      setTimeout(() => {
        if (document.activeElement !== inputRef.current) {
          setIsAutocompleteOpen(false);
        }
      }, 200);
    };

    // Get preview emoji (first emoji in the string)
    const previewEmoji = (() => {
      const emojiMatch = textValue.match(
        /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})/u
      );
      return emojiMatch ? emojiMatch[0] : null;
    })();

    return (
      <div
        className={cn("relative", label || hint ? "space-y-1" : "")}
        ref={containerRef}>
        {label && (
          <Label
            htmlFor={inputId}
            required={required}>
            {label}
          </Label>
        )}
        <div className="flex items-center gap-3 relative">
          {/* Emoji Preview/Picker Button */}
          <div className="relative">
            <Dropdown
              dropdownSelector={
                <>
                  {previewEmoji ? (
                    <span className="text-xl">{previewEmoji}</span>
                  ) : (
                    <HiEmojiHappy className="size-5 text-text-muted" />
                  )}
                </>
              }
              open={isPickerOpen}
              onOpenChange={setIsPickerOpen}
              placement="bottom"
              closeOnItemClick={false}>
              <Dropdown.Panel className="overflow-hidden min-w-[320px]">
                {/* Category Tabs */}
                <div className="border-b border-border overflow-x-auto scrollbar-hide">
                  <div className="flex min-w-max">
                    {Object.keys(EMOJI_CATEGORIES).map((category) => {
                      const isActive = selectedCategory === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className={cn(
                            "px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2",
                            isActive
                              ? "border-primary text-text bg-surface"
                              : "border-transparent text-text-muted hover:text-text hover:border-border"
                          )}
                          aria-selected={isActive}
                          role="tab">
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Category Emojis */}
                <div className="p-3 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_CATEGORIES[
                      selectedCategory as keyof typeof EMOJI_CATEGORIES
                    ].map((emoji, idx) => (
                      <button
                        key={`${selectedCategory}-${idx}`}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="p-2 rounded-lg hover:bg-surface-hover text-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                        aria-label={`Select ${emoji}`}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </Dropdown.Panel>
            </Dropdown>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              id={inputId}
              value={textValue}
              onChange={handleTextChange}
              onBlur={handleTextBlur}
              onFocus={() => {
                // Keep autocomplete open when focusing
                const match = textValue.match(/:([a-z0-9_]+):?$/i);
                if (match) {
                  const query = match[1].toLowerCase();
                  const matches = Object.entries(EMOJI_SHORTCODES)
                    .filter(([shortcode]) =>
                      shortcode.slice(1, -1).toLowerCase().startsWith(query)
                    )
                    .slice(0, 8)
                    .map(([shortcode, emoji]) => ({ shortcode, emoji }));
                  if (matches.length > 0) {
                    setIsAutocompleteOpen(true);
                  }
                }
              }}
              disabled={disabled}
              placeholder="e.g., 🍔 or :food:"
              inputMode="text"
              className={cn(
                baseClasses,
                borderClass,
                widthBaseClasses,
                className
              )}
              {...props}
            />

            {/* Autocomplete Dropdown */}
            {isAutocompleteOpen && autocompleteMatches.length > 0 && (
              <div
                ref={autocompleteRef}
                className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-2xl shadow-lg max-h-64 overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}>
                {autocompleteMatches.map(({ shortcode, emoji }) => (
                  <button
                    key={shortcode}
                    type="button"
                    onClick={() => handleAutocompleteSelect(shortcode, emoji)}
                    className="w-full px-3 py-2 text-left hover:bg-surface-hover flex items-center gap-2 first:rounded-t-2xl last:rounded-b-2xl focus:outline-none focus:bg-surface-hover"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAutocompleteSelect(shortcode, emoji);
                    }}>
                    <span className="text-xl">{emoji}</span>
                    <span className="text-sm text-text-muted">{shortcode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {shouldShowError && error?.message && (
          <p className="text-sm text-danger mt-1">{error.message}</p>
        )}
        {!shouldShowError && hint && (
          <p className="text-xs text-text-muted mt-1">{hint}</p>
        )}
      </div>
    );
  };

  // Render using the adapter
  return renderWithController((currentField) => {
    return renderEmoticonInput(currentField);
  });
}
