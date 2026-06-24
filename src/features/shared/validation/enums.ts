import { z } from "zod";
import {
  getCurrencyOptions as getCurrencyOptionsFromConfig,
  SUPPORTED_CURRENCIES,
  type ICurrency,
} from "@/features/currency/config/currencies";
import {
  PAYMENT_METHOD_VALUES,
  type IPaymentMethod,
} from "@/features/transaction/config/payment-methods";
import { TransactionTypeSchema as GeneratedTransactionTypeSchema } from "./generated.ts/schemas/enums/TransactionType.schema";

export const CurrencySchema = z.enum([...SUPPORTED_CURRENCIES] as [
  string,
  ...string[],
]);

export const PaymentMethodSchema = z.enum([...PAYMENT_METHOD_VALUES]);

export const TransactionTypeSchema = GeneratedTransactionTypeSchema;

export const MessageTypeSchema = z.enum([
  "INFO",
  "SUCCESS",
  "WARNING",
  "ERROR",
]);

export const TimePrecisionSchema = z.enum(["DateTime", "DateOnly"]);

export type { ICurrency, IPaymentMethod };
export type ITransactionType = z.infer<typeof TransactionTypeSchema>;
export type IMessageType = z.infer<typeof MessageTypeSchema>;
export type ITimePrecision = z.infer<typeof TimePrecisionSchema>;

export { getCurrencyOptionsFromConfig as getCurrencyOptions };
