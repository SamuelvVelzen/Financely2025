import type { ITransactionType } from "@/features/shared/validation/schemas";
import { RECOMMENDED_TAGS } from "@/features/tag/config/recommended-tags";

const EMOJI_REGEX =
  /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})/u;

export const EMOJI_SHORTCODES: Record<string, string> = {
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
  ":salary:": "💼",
  ":investment:": "📈",
  ":business:": "🏢",
  ":refund:": "↩️",
  ":bonus:": "🎯",
};

export const EMOJI_CATEGORIES: Record<string, string[]> = {
  "Money & Finance": ["💰", "💵", "💴", "💶", "💷", "💳", "🏦", "📊", "📈", "💾"],
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
    "🍽️",
  ],
  Shopping: ["🛍️", "🛒", "💼", "👔", "👗", "👠", "👜"],
  "Travel & Places": ["🚗", "✈️", "🚂", "🚲", "🏠", "🏖️", "🗽", "🌍", "🗺️", "⛽"],
  "Health & Medical": ["🏥", "💊", "🩺", "🚑", "💉", "🦷", "👁️"],
  Activities: ["⚽", "🎮", "🎬", "🎵", "🎨", "📚", "🎯", "🎪", "🎭"],
  Objects: ["💻", "📱", "💳", "🔑", "⌚", "📺", "📷", "🎁", "💡", "🔧"],
  Symbols: ["❤️", "⭐", "🔥", "💯", "✅", "❌", "⚠️", "🎯"],
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
  Other: ["📦", "🔒", "🔓", "🎉", "🎊", "🎈", "↩️"],
};

export const DEFAULT_EMOJI_CATEGORY = "Money & Finance";

export type IEmojiCatalogEntry = {
  emoji: string;
  keywords: string[];
  label: string;
  categories: string[];
};

export type ISuggestedEmoji = {
  emoji: string;
  label: string;
};

function categoryKeywords(category: string): string[] {
  return category
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function upsertCatalogEntry(
  catalog: Map<string, IEmojiCatalogEntry>,
  emoji: string,
  {
    keywords = [],
    label,
    category,
  }: {
    keywords?: string[];
    label?: string;
    category?: string;
  },
) {
  const existing = catalog.get(emoji);
  const categoryKeywordsList = category ? categoryKeywords(category) : [];

  if (existing) {
    existing.keywords = [
      ...new Set([...existing.keywords, ...keywords, ...categoryKeywordsList]),
    ];
    if (category && !existing.categories.includes(category)) {
      existing.categories.push(category);
    }
    if (label && existing.label === existing.emoji) {
      existing.label = label;
    }
    return;
  }

  catalog.set(emoji, {
    emoji,
    keywords: [...new Set([...keywords, ...categoryKeywordsList])],
    label: label ?? emoji,
    categories: category ? [category] : [],
  });
}

let cachedCatalog: IEmojiCatalogEntry[] | null = null;

export function getEmojiCatalog(): IEmojiCatalogEntry[] {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  const catalog = new Map<string, IEmojiCatalogEntry>();

  for (const [shortcode, emoji] of Object.entries(EMOJI_SHORTCODES)) {
    const keyword = shortcode.slice(1, -1);
    upsertCatalogEntry(catalog, emoji, {
      keywords: [keyword, shortcode],
      label: keyword.replace(/_/g, " "),
    });
  }

  for (const [category, emojis] of Object.entries(EMOJI_CATEGORIES)) {
    for (const emoji of emojis) {
      upsertCatalogEntry(catalog, emoji, { category });
    }
  }

  for (const tag of RECOMMENDED_TAGS) {
    if (!tag.emoticon) continue;
    upsertCatalogEntry(catalog, tag.emoticon, {
      keywords: tag.name
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
      label: tag.name,
    });
  }

  cachedCatalog = Array.from(catalog.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return cachedCatalog;
}

export function getSuggestedEmojis(
  transactionType?: ITransactionType,
): ISuggestedEmoji[] {
  const seen = new Set<string>();

  return RECOMMENDED_TAGS.filter((tag) => {
    if (!tag.emoticon || seen.has(tag.emoticon)) {
      return false;
    }
    if (transactionType && tag.transactionType !== transactionType) {
      return false;
    }
    seen.add(tag.emoticon);
    return true;
  }).map((tag) => ({
    emoji: tag.emoticon!,
    label: tag.name,
  }));
}

export function extractFirstEmoji(value: string): string | null {
  EMOJI_REGEX.lastIndex = 0;
  const match = value.match(EMOJI_REGEX);
  return match ? match[0] : null;
}

export function normalizeEmoticon(value: string): string {
  return extractFirstEmoji(value.trim()) ?? "";
}

export function searchEmojiCatalog(query: string): IEmojiCatalogEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  const normalizedQuery = trimmed.startsWith(":")
    ? trimmed.slice(1)
    : trimmed;

  return getEmojiCatalog().filter((entry) => {
    if (entry.emoji === query.trim()) {
      return true;
    }

    return (
      entry.label.toLowerCase().includes(normalizedQuery) ||
      entry.keywords.some((keyword) => keyword.includes(normalizedQuery)) ||
      entry.categories.some((category) =>
        category.toLowerCase().includes(normalizedQuery),
      )
    );
  });
}
