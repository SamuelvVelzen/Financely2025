import type { ITransactionType } from "@/features/shared/validation/schemas";
import { RECOMMENDED_TAGS } from "@/features/tag/config/recommended-tags";

export interface IDefaultTagRulePreset {
  id: string;
  label: string;
  tagName: string;
  transactionType: ITransactionType;
  keywords: string[];
  priority: number;
}

export const DEFAULT_TAG_RULE_PRESETS: IDefaultTagRulePreset[] = [
  {
    id: "nl-supermarkets",
    label: "Dutch supermarkets",
    tagName: "Food & Dining",
    transactionType: "EXPENSE",
    keywords: [
      "albert heijn",
      "ah to go",
      "jumbo",
      "dirk",
      "lidl",
      "aldi",
      "plus ",
      "coop",
      "spar",
      "hoogvliet",
      "vomar",
    ],
    priority: 10,
  },
  {
    id: "nl-food-delivery",
    label: "Food delivery",
    tagName: "Food & Dining",
    transactionType: "EXPENSE",
    keywords: [
      "thuisbezorgd",
      "uber eats",
      "deliveroo",
      "dominos",
      "pizza hut",
      "just eat",
    ],
    priority: 9,
  },
  {
    id: "nl-public-transport",
    label: "Dutch public transport",
    tagName: "Transportation",
    transactionType: "EXPENSE",
    keywords: [
      "ov-chipkaart",
      "ns groep",
      "nederlandse spoorwegen",
      "gvb",
      "ret",
      "htm",
      "arriva",
      "connexxion",
      "ebs",
    ],
    priority: 10,
  },
  {
    id: "nl-fuel",
    label: "Fuel stations",
    tagName: "Transportation",
    transactionType: "EXPENSE",
    keywords: [
      "shell",
      "bp ",
      "totalenergies",
      "esso",
      "tango",
      "tanqyou",
      "q8",
      "tinq",
      "avia",
    ],
    priority: 8,
  },
  {
    id: "nl-utilities",
    label: "Bills & utilities (NL)",
    tagName: "Bills & Utilities",
    transactionType: "EXPENSE",
    keywords: [
      "eneco",
      "vattenfall",
      "essent",
      "greenchoice",
      "ziggo",
      "kpn",
      "odido",
      "waternet",
      "vitens",
    ],
    priority: 10,
  },
  {
    id: "streaming",
    label: "Streaming services",
    tagName: "Entertainment",
    transactionType: "EXPENSE",
    keywords: [
      "netflix",
      "spotify",
      "disney plus",
      "disney+",
      "hbo max",
      "amazon prime",
      "apple.com/bill",
      "youtube premium",
      "videoland",
      "npo plus",
    ],
    priority: 9,
  },
  {
    id: "nl-healthcare",
    label: "Healthcare (NL)",
    tagName: "Healthcare",
    transactionType: "EXPENSE",
    keywords: [
      "apotheek",
      "kruidvat",
      "etos",
      "holland barrett",
      "ziekenhuis",
      "huisarts",
      "cz ",
      "vgz",
      "menzis",
      "zilveren kruis",
    ],
    priority: 8,
  },
  {
    id: "nl-online-shopping",
    label: "Online shopping",
    tagName: "Shopping",
    transactionType: "EXPENSE",
    keywords: [
      "bol.com",
      "amazon",
      "coolblue",
      "zalando",
      "h&m",
      "ikea",
      "action",
      "primark",
    ],
    priority: 7,
  },
];

export function getPresetsForTag(
  tag: Pick<{ name: string; transactionType: ITransactionType }, "name" | "transactionType">,
): IDefaultTagRulePreset[] {
  const normalizedName = tag.name.toLowerCase().trim();
  return DEFAULT_TAG_RULE_PRESETS.filter(
    (preset) =>
      preset.transactionType === tag.transactionType &&
      preset.tagName.toLowerCase().trim() === normalizedName,
  );
}

export function getRelatedPresetsForTag(
  tag: Pick<{ name: string; transactionType: ITransactionType }, "name" | "transactionType">,
  rules: { source: string; label: string | null }[],
  allPresets: IDefaultTagRulePreset[] = DEFAULT_TAG_RULE_PRESETS,
): IDefaultTagRulePreset[] {
  const byName = getPresetsForTag(tag);
  const systemLabels = new Set(
    rules
      .filter((rule) => rule.source === "SYSTEM" && rule.label)
      .map((rule) => rule.label as string),
  );
  const byEnabledRule = allPresets.filter(
    (preset) =>
      preset.transactionType === tag.transactionType &&
      systemLabels.has(preset.label),
  );

  const seen = new Set<string>();
  return [...byName, ...byEnabledRule].filter((preset) => {
    if (seen.has(preset.id)) {
      return false;
    }
    seen.add(preset.id);
    return true;
  });
}

export function getDefaultTagRulePreset(
  id: string,
): IDefaultTagRulePreset | undefined {
  return DEFAULT_TAG_RULE_PRESETS.find((preset) => preset.id === id);
}

export function getRecommendedTagMetadataForPreset(tagName: string) {
  return RECOMMENDED_TAGS.find((tag) => tag.name === tagName);
}
