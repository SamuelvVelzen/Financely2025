import {
  useCashCount,
  useCreateLedgerAccount,
  useLedgerAccounts,
} from "@/features/ledger-account/hooks/useLedgerAccounts";
import { Currency } from "@/features/currency/components/currency";
import { Container } from "@/features/ui/container/container";
import { Title } from "@/features/ui/typography/title";
import { Button } from "@/features/ui/button/button";
import { TextInput } from "@/features/ui/input/text-input";
import { ResponsiveDialog } from "@/features/ui/dialog/responsive-dialog";
import { useState } from "react";
import { HiWallet } from "react-icons/hi2";

export function LedgerAccountsPage() {
  const { data, isLoading } = useLedgerAccounts();
  const createAccount = useCreateLedgerAccount();
  const cashCount = useCashCount();
  const [createOpen, setCreateOpen] = useState(false);
  const [cashTargetId, setCashTargetId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [actualBalance, setActualBalance] = useState("");

  const accounts = data?.data ?? [];

  return (
    <Container className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Title className="flex items-center gap-2">
          <HiWallet />
          Accounts
        </Title>
        <Button clicked={() => setCreateOpen(true)} size="sm">
          Add account
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-text-muted">
          Create ING, N26, or a cash wallet to track transfers and balances.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-xs text-text-muted">{account.kind}</p>
              </div>
              <div className="flex items-center gap-2">
                <Currency
                  amount={account.balance ?? account.openingBalance}
                  currency={account.currency}
                />
                {account.kind === "CASH" ? (
                  <Button
                    size="sm"
                    variant="default"
                    clicked={() => setCashTargetId(account.id)}>
                    Count cash
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ResponsiveDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add account"
        content={
          <div className="space-y-3">
            <TextInput
              label="Name"
              value={name}
              onChange={(value) => setName(String(value ?? ""))}
            />
            <TextInput
              label="Currency"
              value={currency}
              onChange={(value) =>
                setCurrency(String(value ?? "").toUpperCase())
              }
            />
            <Button
              clicked={() => {
                if (!name.trim()) return;
                createAccount.mutate(
                  {
                    name: name.trim(),
                    kind: "BANK",
                    currency,
                    openingBalance: "0",
                  },
                  {
                    onSuccess: () => {
                      setCreateOpen(false);
                      setName("");
                    },
                  },
                );
              }}>
              Save
            </Button>
          </div>
        }
      />

      <ResponsiveDialog
        open={cashTargetId != null}
        onOpenChange={(open) => {
          if (!open) setCashTargetId(null);
        }}
        title="Count my cash"
        content={
          <div className="space-y-3">
            <TextInput
              label="Cash in wallet"
              value={actualBalance}
              onChange={(value) => setActualBalance(String(value ?? ""))}
            />
            <Button
              clicked={() => {
                if (!cashTargetId || !actualBalance.trim()) return;
                cashCount.mutate(
                  {
                    accountId: cashTargetId,
                    input: { actualBalance: actualBalance.trim() },
                  },
                  {
                    onSuccess: () => {
                      setCashTargetId(null);
                      setActualBalance("");
                    },
                  },
                );
              }}>
              Save
            </Button>
          </div>
        }
      />
    </Container>
  );
}
