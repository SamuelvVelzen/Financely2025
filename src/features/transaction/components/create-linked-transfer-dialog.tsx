import { CurrencySelect } from "@/features/currency/components/currency-select";
import { LedgerAccountSelect } from "@/features/ledger-account/components/ledger-account-select";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { CreateLinkedTransferInputSchema } from "@/features/shared/validation/schemas";
import { useCreateLinkedTransfer } from "@/features/transaction/hooks/useTransfers";
import { ResponsiveDialog } from "@/features/ui/dialog/responsive-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { DateInput } from "@/features/ui/input/date-input";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { TextInput } from "@/features/ui/input/text-input";
import { Textarea } from "@/features/ui/input/textarea";
import { useToast } from "@/features/ui/toast";
import {
  dateOnlyToIso,
  isoToDateOnly,
} from "@/features/util/date/dateisohelpers";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { useDefaultCurrency } from "@/features/workspace/hooks/useWorkspaceSettings";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId } from "react";
import type { Resolver } from "react-hook-form";
import { z } from "zod";

type ICreateLinkedTransferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const LinkedTransferFormSchema = CreateLinkedTransferInputSchema.extend({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0;
    }, "Amount must be positive"),
  transactionDate: z.string().min(1, "Date is required"),
});

type FormData = z.infer<typeof LinkedTransferFormSchema>;

function getTodayDateOnlyIso(): string {
  const now = new Date();
  const dateOnly = isoToDateOnly(now.toISOString());
  return dateOnlyToIso(dateOnly);
}

export function CreateLinkedTransferDialog({
  open,
  onOpenChange,
  onSuccess,
}: ICreateLinkedTransferDialogProps) {
  const workspaceId = useNavWorkspaceId();
  const defaultCurrency = useDefaultCurrency(workspaceId);
  const createTransfer = useCreateLinkedTransfer();
  const toast = useToast();
  const formId = useId();

  const form = useFinForm<FormData>({
    resolver: zodResolver(LinkedTransferFormSchema) as Resolver<FormData>,
    defaultValues: {
      fromLedgerAccountId: "",
      toLedgerAccountId: "",
      amount: "",
      currency: defaultCurrency,
      transactionDate: getTodayDateOnlyIso(),
      name: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      fromLedgerAccountId: "",
      toLedgerAccountId: "",
      amount: "",
      currency: defaultCurrency,
      transactionDate: getTodayDateOnlyIso(),
      name: "",
      notes: "",
    });
  }, [open, defaultCurrency, form]);

  const pending = createTransfer.isPending;

  const handleSubmit = async (data: FormData) => {
    if (data.fromLedgerAccountId === data.toLedgerAccountId) {
      toast.error("From and to accounts must differ");
      return;
    }

    try {
      const result = await createTransfer.mutateAsync({
        fromLedgerAccountId: data.fromLedgerAccountId,
        toLedgerAccountId: data.toLedgerAccountId,
        amount: data.amount,
        currency: data.currency,
        transactionDate: data.transactionDate,
        name: data.name?.trim() || undefined,
        notes: data.notes?.trim() ? data.notes.trim() : null,
      });
      if (!isOfflineMutationPlaceholder(result)) {
        toast.success("Transfer recorded on both accounts");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to create transfer");
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Record transfer"
      disableInitialFocus
      content={
        <Form<FormData> form={form} id={formId} onSubmit={handleSubmit}>
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Move money between two accounts (e.g. ING → N26 or ATM → cash).
            </p>
            <LedgerAccountSelect
              name="fromLedgerAccountId"
              label="From account"
              allowEmpty={false}
              disabled={pending}
            />
            <LedgerAccountSelect
              name="toLedgerAccountId"
              label="To account"
              allowEmpty={false}
              disabled={pending}
            />
            <div className="grid grid-cols-2 gap-4">
              <DecimalInput
                name="amount"
                label="Amount"
                currency={form.watch("currency")}
                disabled={pending}
                required
              />
              <CurrencySelect
                name="currency"
                label="Currency"
                disabled={pending}
                workspaceId={workspaceId}
              />
            </div>
            <DateInput
              name="transactionDate"
              label="Date"
              mode="dateOnly"
              disabled={pending}
              required
            />
            <TextInput
              name="name"
              label="Label (optional)"
              disabled={pending}
              hint="Defaults to “From → To” if empty"
            />
            <Textarea
              name="notes"
              label="Notes (optional)"
              disabled={pending}
            />
          </div>
        </Form>
      }
      footerButtons={[
        {
          variant: "default",
          clicked: () => onOpenChange(false),
          buttonContent: "Cancel",
          disabled: pending,
        },
        {
          variant: "primary",
          type: "submit",
          form: formId,
          buttonContent: "Save transfer",
          loading: pending,
        },
      ]}
    />
  );
}
