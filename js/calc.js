// Live totals — money values are integer cents end-to-end.
// Mirrors the BE engine; BE recomputes on submit and is the source of truth.

export function computeTotals({
  inflowCents = 0,
  outflowCents = 0,
  deductibleCents = [],
  privateReserveBalanceCents = 0,
  balancesByAccountId = {},
  trustValueCents = 0,
  accounts = [],
}) {
  const excessMonthly = inflowCents - outflowCents;
  const deductiblesSum = deductibleCents.reduce((s, x) => s + (Number(x) || 0), 0);
  const privateReserveTarget = 6 * outflowCents + deductiblesSum;
  const longTermRemainder = Math.max(0, privateReserveBalanceCents - privateReserveTarget);

  const sumWhere = (pred) =>
    accounts
      .filter((a) => a.active !== false)
      .filter(pred)
      .reduce((s, a) => s + (balancesByAccountId[a.id] ?? 0), 0);

  const client1Retirement = sumWhere(
    (a) => a.kind === "retirement" && a.owner === "client",
  );
  const client2Retirement = sumWhere(
    (a) => a.kind === "retirement" && a.owner === "spouse",
  );
  const nonRetirement = sumWhere((a) => a.kind === "non_retirement");
  const liabilities = sumWhere((a) => a.kind === "liability");

  // Liabilities are NOT subtracted; trust is its own line item.
  const grandTotal = client1Retirement + client2Retirement + nonRetirement + trustValueCents;

  return {
    excessMonthly,
    privateReserveTarget,
    longTermRemainder,
    client1Retirement,
    client2Retirement,
    nonRetirement,
    trustValueCents,
    grandTotal,
    liabilities,
  };
}

// drift in cents — mirror BE numbers if > 1c off
export function driftCents(serverFloat, localCents) {
  return Math.abs(Math.round(Number(serverFloat) * 100) - localCents);
}
