import { getCurrencyMinorUnits } from "@/features/currency/config/currencies";
import { SplitExpenseShareStepper } from "@/features/split/components/split-expense-share-stepper";
import type { ISplitMode } from "@/features/split/utils/split-mode";
import {
  buildEqualAmountInputs,
  buildEqualPercentInputs,
  buildEqualShareWeightInputs,
} from "@/features/split/utils/split-expense-form-values";
import { ButtonToggleGroup } from "@/features/ui/button/button-toggle-group";
import { LinkButton } from "@/features/ui/button/link-button";
import { Checkbox } from "@/features/ui/checkbox";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { Label } from "@/features/ui/typography/label";
import { Text } from "@/features/ui/typography/text";

type IMember = { id: string; displayName: string };

const SPLIT_MODE_OPTIONS: Array<{ value: ISplitMode; label: string }> = [
  { value: "equal", label: "Equal" },
  { value: "exact", label: "Amounts" },
  { value: "percent", label: "%" },
  { value: "shares", label: "Shares" },
];

function parseInputSum(values: string[]): number {
  return values.reduce((acc, value) => {
    const parsed = parseFloat(value);
    return acc + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
}

function parseShareValue(value: string | undefined): number {
  const parsed = parseFloat(value ?? "");
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function getDefaultShareInputs(
  splitMode: ISplitMode,
  amount: string,
  currency: string,
  participantIds: string[],
  paidByMemberId: string,
): Record<string, string> {
  if (splitMode === "exact") {
    return buildEqualAmountInputs(
      amount,
      currency,
      participantIds,
      paidByMemberId,
    );
  }
  if (splitMode === "percent") {
    return buildEqualPercentInputs(participantIds);
  }
  if (splitMode === "shares") {
    return buildEqualShareWeightInputs(participantIds);
  }
  return {};
}

function hasShareInputChanges(
  splitMode: ISplitMode,
  memberIds: string[],
  participantIds: string[],
  shareInputs: Record<string, string>,
  defaults: Record<string, string>,
): boolean {
  if (participantIds.length !== memberIds.length) {
    return true;
  }
  if (memberIds.some((id) => !participantIds.includes(id))) {
    return true;
  }
  if (splitMode === "equal") {
    return false;
  }
  return participantIds.some(
    (id) => (shareInputs[id] ?? "").trim() !== (defaults[id] ?? "").trim(),
  );
}

export function SplitExpenseSplitSection({
  members,
  amount,
  currency,
  paidByMemberId,
  participantIds,
  splitMode,
  shareInputs,
  disabled,
  onParticipantIdsChange,
  onSplitModeChange,
  onShareInputsChange,
}: {
  members: IMember[];
  amount: string;
  currency: string;
  paidByMemberId: string;
  participantIds: string[];
  splitMode: ISplitMode;
  shareInputs: Record<string, string>;
  disabled?: boolean;
  onParticipantIdsChange: (ids: string[]) => void;
  onSplitModeChange: (mode: ISplitMode) => void;
  onShareInputsChange: (inputs: Record<string, string>) => void;
}) {
  const toggleParticipant = (id: string) => {
    const nextIds = participantIds.includes(id)
      ? participantIds.filter((x) => x !== id)
      : [...participantIds, id];

    onParticipantIdsChange(nextIds);

    if (splitMode === "equal") {
      return;
    }

    if (splitMode === "exact") {
      onShareInputsChange(
        buildEqualAmountInputs(amount, currency, nextIds, paidByMemberId),
      );
      return;
    }

    if (splitMode === "percent") {
      onShareInputsChange(buildEqualPercentInputs(nextIds));
      return;
    }

    onShareInputsChange(buildEqualShareWeightInputs(nextIds));
  };

  const handleModeChange = (mode: ISplitMode) => {
    onSplitModeChange(mode);
    if (mode === "equal") {
      onShareInputsChange({});
      return;
    }
    if (mode === "exact") {
      onShareInputsChange(
        buildEqualAmountInputs(
          amount,
          currency,
          participantIds,
          paidByMemberId,
        ),
      );
      return;
    }
    if (mode === "percent") {
      onShareInputsChange(buildEqualPercentInputs(participantIds));
      return;
    }
    onShareInputsChange(buildEqualShareWeightInputs(participantIds));
  };

  const setShareInput = (memberId: string, value: string) => {
    const nextValue = String(value ?? "").trim();
    const nextAmount = parseShareValue(nextValue);

    if (nextValue !== "" && nextAmount <= 0) {
      onParticipantIdsChange(participantIds.filter((id) => id !== memberId));
      const nextInputs = { ...shareInputs };
      delete nextInputs[memberId];
      onShareInputsChange(nextInputs);
      return;
    }

    onShareInputsChange({ ...shareInputs, [memberId]: nextValue });
  };

  const setShareWeight = (memberId: string, value: string) => {
    const nextCount = Math.max(0, Math.round(parseShareValue(value)));

    if (nextCount <= 0) {
      onParticipantIdsChange(participantIds.filter((id) => id !== memberId));
      const nextInputs = { ...shareInputs };
      delete nextInputs[memberId];
      onShareInputsChange(nextInputs);
      return;
    }

    const nextIds = participantIds.includes(memberId)
      ? participantIds
      : [...participantIds, memberId];
    onParticipantIdsChange(nextIds);
    onShareInputsChange({ ...shareInputs, [memberId]: String(nextCount) });
  };

  const allMemberIds = members.map((member) => member.id);
  const defaultShareInputs = getDefaultShareInputs(
    splitMode,
    amount,
    currency,
    allMemberIds,
    paidByMemberId,
  );
  const canReset = hasShareInputChanges(
    splitMode,
    allMemberIds,
    participantIds,
    shareInputs,
    defaultShareInputs,
  );

  const handleReset = () => {
    onParticipantIdsChange(allMemberIds);
    onShareInputsChange(
      splitMode === "equal" ? {} : defaultShareInputs,
    );
  };

  const allocated = parseInputSum(
    participantIds.map((id) => shareInputs[id] ?? "0"),
  );
  const totalAmount = parseFloat(amount);
  const amountTarget = Number.isFinite(totalAmount) ? totalAmount : 0;
  const minor = getCurrencyMinorUnits(currency);
  const amountRemaining = Number((amountTarget - allocated).toFixed(minor));
  const percentRemaining = Number((100 - allocated).toFixed(2));

  let statusText: string | null = null;
  if (splitMode === "exact" && amount.trim()) {
    statusText =
      amountRemaining === 0
        ? "Amounts add up"
        : `${amountRemaining > 0 ? amountRemaining.toFixed(minor) : Math.abs(amountRemaining).toFixed(minor)} ${currency} ${amountRemaining > 0 ? "left" : "over"}`;
  } else if (splitMode === "percent") {
    statusText =
      percentRemaining === 0
        ? "Percentages add up to 100%"
        : `${percentRemaining > 0 ? percentRemaining.toFixed(2) : Math.abs(percentRemaining).toFixed(2)}% ${percentRemaining > 0 ? "left" : "over"}`;
  }

  const inputSuffix = splitMode === "percent" ? "%" : undefined;

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <Label className="block">Split</Label>
          {canReset ? (
            <LinkButton
              size="xs"
              variant="primary"
              disabled={disabled}
              clicked={handleReset}>
              Reset
            </LinkButton>
          ) : null}
        </div>
        <ButtonToggleGroup
          value={splitMode}
          onChange={handleModeChange}
          options={SPLIT_MODE_OPTIONS}
          size="sm"
          ariaLabel="Split method"
          disabled={disabled}
          className="w-full"
        />
        {statusText ? (
          <Text
            size="xs"
            isMuted
            className="mt-2 text-center">
            {statusText}
          </Text>
        ) : null}
      </div>
      <ul className="space-y-2">
        {members.map((member) => {
          const isParticipant = participantIds.includes(member.id);
          const shareValue = parseShareValue(shareInputs[member.id]);
          const isZeroShare =
            splitMode !== "equal" && isParticipant && shareValue === 0;

          if (splitMode === "equal") {
            return (
              <li key={member.id}>
                <Checkbox
                  label={member.displayName}
                  checked={isParticipant}
                  onChange={() => toggleParticipant(member.id)}
                  disabled={disabled}
                />
              </li>
            );
          }

          if (splitMode === "shares") {
            return (
              <li
                key={member.id}
                className="flex items-center gap-2">
                <Checkbox
                  label={member.displayName}
                  checked={isParticipant}
                  onChange={() => toggleParticipant(member.id)}
                  disabled={disabled || isZeroShare}
                  className="min-w-0 flex-1"
                />
                <SplitExpenseShareStepper
                  value={shareInputs[member.id] ?? (isParticipant ? "1" : "0")}
                  disabled={disabled}
                  onChange={(value) => setShareWeight(member.id, value)}
                  ariaLabel={`${member.displayName} shares`}
                />
              </li>
            );
          }

          return (
            <li
              key={member.id}
              className="flex items-center gap-2">
              <Checkbox
                label={member.displayName}
                checked={isParticipant}
                onChange={() => toggleParticipant(member.id)}
                disabled={disabled || isZeroShare}
                className="min-w-0 flex-1"
              />
              <DecimalInput
                value={isParticipant ? (shareInputs[member.id] ?? "") : ""}
                onChange={(v) => setShareInput(member.id, String(v ?? ""))}
                disabled={disabled || !isParticipant}
                currency={splitMode === "exact" ? currency : undefined}
                className="w-28 shrink-0"
                aria-label={`${member.displayName} ${splitMode === "exact" ? "amount" : "percent"}`}
              />
              {inputSuffix ? (
                <Text
                  size="sm"
                  isMuted
                  className="w-10 shrink-0">
                  {inputSuffix}
                </Text>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
