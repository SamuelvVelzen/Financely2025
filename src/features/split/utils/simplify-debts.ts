export type IMemberBalance = {
  memberId: string;
  displayName: string;
  netAmount: string;
};

export type ISimplifiedDebt = {
  fromMemberId: string;
  fromDisplayName: string;
  toMemberId: string;
  toDisplayName: string;
  amount: string;
};

export function simplifyDebts(
  memberBalances: IMemberBalance[],
  currency: string,
): ISimplifiedDebt[] {
  const minorUnits = currency === "JPY" ? 0 : 2;
  const factor = 10 ** minorUnits;

  const toMinor = (s: string) => Math.round(parseFloat(s) * factor);
  const fromMinor = (n: number) => (n / factor).toFixed(minorUnits);

  const creditors: Array<{ memberId: string; displayName: string; amount: number }> =
    [];
  const debtors: Array<{ memberId: string; displayName: string; amount: number }> =
    [];

  for (const mb of memberBalances) {
    const minor = toMinor(mb.netAmount);
    if (minor > 0) {
      creditors.push({
        memberId: mb.memberId,
        displayName: mb.displayName,
        amount: minor,
      });
    } else if (minor < 0) {
      debtors.push({
        memberId: mb.memberId,
        displayName: mb.displayName,
        amount: -minor,
      });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const debts: ISimplifiedDebt[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]!;
    const creditor = creditors[j]!;
    const pay = Math.min(debtor.amount, creditor.amount);

    if (pay > 0) {
      debts.push({
        fromMemberId: debtor.memberId,
        fromDisplayName: debtor.displayName,
        toMemberId: creditor.memberId,
        toDisplayName: creditor.displayName,
        amount: fromMinor(pay),
      });
    }

    debtor.amount -= pay;
    creditor.amount -= pay;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return debts;
}
