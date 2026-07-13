import { Currency } from "@/features/currency/components/currency";
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
            <Currency
              amount={Math.abs(net).toFixed(2)}
              currency={currency}
              type="EXPENSE"
              className="text-3xl font-bold text-danger"
            />
          </>
        ) : net > 0.005 ? (
          <>
            <p className="text-sm text-text-muted">You are owed</p>
            <Currency
              amount={net.toFixed(2)}
              currency={currency}
              type="INCOME"
              className="text-3xl font-bold text-success"
            />
          </>
        ) : (
          <>
            <p className="text-sm text-text-muted">All settled up</p>
            <Currency
              amount="0"
              currency={currency}
              className="text-2xl font-bold"
            />
          </>
        )}
      </div>
      {balances.simplifiedDebts.length > 0 ? (
        <ul className="border-t border-border pt-4 space-y-2">
          {balances.simplifiedDebts.map((debt) => (
            <li key={`${debt.fromMemberId}-${debt.toMemberId}`} className="text-sm text-text-muted">
              {debt.fromDisplayName} owes {debt.toDisplayName}{" "}
              <Currency amount={debt.amount} currency={currency} />
            </li>
          ))}
        </ul>
      ) : null}
    </Container>
  );
}
