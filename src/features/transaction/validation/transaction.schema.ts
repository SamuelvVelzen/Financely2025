import { z } from "zod";
import { BANK_VALUES } from "../config/banks";

export const BankSchema = z.enum(BANK_VALUES);
export type IBank = z.infer<typeof BankSchema>;

