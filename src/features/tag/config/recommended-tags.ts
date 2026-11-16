import type { ITagTransactionType } from "@/features/tag/utils/tag-transaction-type";

export interface IRecommendedTag {
  name: string;
  transactionType: ITagTransactionType;
  emoticon?: string;
  color?: string;
  description?: string;
}

export const RECOMMENDED_TAGS: IRecommendedTag[] = [
  {
    name: "Food & Dining",
    transactionType: "EXPENSE",
    emoticon: "🍔",
    color: "#FF6B6B",
    description: "Restaurants, groceries, and food-related expenses",
  },
  {
    name: "Transportation",
    transactionType: "EXPENSE",
    emoticon: "🚗",
    color: "#4ECDC4",
    description: "Gas, public transit, car maintenance, and travel",
  },
  {
    name: "Shopping",
    transactionType: "EXPENSE",
    emoticon: "🛍️",
    color: "#9B59B6",
    description: "General shopping and retail purchases",
  },
  {
    name: "Entertainment",
    transactionType: "EXPENSE",
    emoticon: "🎬",
    color: "#E91E63",
    description: "Movies, concerts, hobbies, and leisure activities",
  },
  {
    name: "Bills & Utilities",
    transactionType: "EXPENSE",
    emoticon: "💡",
    color: "#F39C12",
    description: "Electricity, water, internet, phone, and other bills",
  },
  {
    name: "Healthcare",
    transactionType: "EXPENSE",
    emoticon: "🏥",
    color: "#2ECC71",
    description: "Medical expenses, prescriptions, and health services",
  },
  {
    name: "Salary",
    transactionType: "INCOME",
    emoticon: "💼",
    color: "#27AE60",
    description: "Regular salary or wages from employment",
  },
  {
    name: "Freelance",
    transactionType: "INCOME",
    emoticon: "💻",
    color: "#3498DB",
    description: "Freelance work and contract income",
  },
  {
    name: "Investment Returns",
    transactionType: "INCOME",
    emoticon: "📈",
    color: "#2ECC71",
    description: "Dividends, interest, and investment gains",
  },
  {
    name: "Business Income",
    transactionType: "INCOME",
    emoticon: "🏢",
    color: "#9B59B6",
    description: "Income from business operations",
  },
  {
    name: "Rental Income",
    transactionType: "INCOME",
    emoticon: "🏠",
    color: "#E67E22",
    description: "Rental property income",
  },
  {
    name: "Gift",
    transactionType: "INCOME",
    emoticon: "🎁",
    color: "#E91E63",
    description: "Gifts and monetary presents received",
  },
  {
    name: "Refund",
    transactionType: "INCOME",
    emoticon: "↩️",
    color: "#16A085",
    description: "Refunds and reimbursements",
  },
  {
    name: "Bonus",
    transactionType: "INCOME",
    emoticon: "🎯",
    color: "#F39C12",
    description: "Bonuses and performance incentives",
  },
  {
    name: "Savings",
    transactionType: "EXPENSE",
    emoticon: "💾",
    color: "#3498DB",
    description: "Savings transfers and investment contributions",
  },
  {
    name: "Other",
    transactionType: "EXPENSE",
    emoticon: "📦",
    color: "#95A5A6",
    description: "Miscellaneous expenses that don't fit other categories",
  },
];
