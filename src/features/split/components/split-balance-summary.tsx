import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { Container } from "@/features/ui/container/container";

type IBalanceData = {
  currency: string;
  viewerNetAmount?: string;
  simplifiedDebts: Array<{
    fromMemberId: string;
    fromDisplayName: string;
    toMemberId: string;
    toDisplayName: string;
    amount: string;
  }>;
};

export function SplitBalanceSummary({ balances }: { balances: IBalanceData }) {
  const net = parseFloat(balances.viewerNetAmount ?? "0");
  const currency = balances.currency;

  return (
    <Container className="mb-6">
      <div className="text-center py-4">
        {net < -0.005 ? (
          <>
            <p className="text-sm text-text-muted">You owe</p>
            <p className="text-3xl font-bold text-danger">
              {formatCurrency(Math.abs(net).toFixed(2), currency)}
            </p>
          </>
        ) : net > 0.005 ? (
          <>
            <p className="text-sm text-text-muted">You are owed</p>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(net.toFixed(2), currency)}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-text-muted">All settled up</p>
            <p className="text-2xl font-bold text-text">
              {formatCurrency("0", currency)}
            </p>
          </>
        )}
      </div>
      {balances.simplifiedDebts.length > 0 ? (
        <ul className="border-t border-border pt-4 space-y-2">
          {balances.simplifiedDebts.map((debt) => (
            <li key={`${debt.fromMemberId}-${debt.toMemberId}`} className="text-sm text-text-muted">
              {debt.fromDisplayName} owes {debt.toDisplayName}{" "}
              {formatCurrency(debt.amount, currency)}
            </li>
          ))}
        </ul>
      ) : null}
    </Container>
  );
}
