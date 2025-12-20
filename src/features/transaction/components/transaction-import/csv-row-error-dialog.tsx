"use client";

import type { ICsvCandidateTransaction } from "@/features/shared/validation/schemas";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";

interface ICsvRowErrorDialogProps {
  candidate: ICsvCandidateTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CsvRowErrorDialog({
  candidate,
  open,
  onOpenChange,
}: ICsvRowErrorDialogProps) {
  if (!candidate || candidate.errors.length === 0) {
    return null;
  }

  return (
    <Dialog
      title={`Errors for Row ${candidate.rowIndex + 1}`}
      content={
        <div className="space-y-3">
          <div className="text-sm text-text-muted mb-4">
            The following errors were found while parsing this transaction:
          </div>
          <div className="space-y-2">
            {candidate.errors.map((error, index) => (
              <div
                key={index}
                className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                <div className="font-medium text-sm text-danger mb-1">
                  {error.field}
                </div>
                <div className="text-sm text-text">{error.message}</div>
              </div>
            ))}
          </div>
        </div>
      }
      footerButtons={[
        {
          clicked: () => onOpenChange(false),
          buttonContent: "Close",
          variant: "primary",
        },
      ]}
      open={open}
      onOpenChange={onOpenChange}
      variant="modal"
      size="md"
      status="danger"
    />
  );
}

