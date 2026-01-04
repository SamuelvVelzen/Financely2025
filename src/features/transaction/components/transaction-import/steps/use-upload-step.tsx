import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { FileUploadInput } from "@/features/ui/input/file-upload-input";
import { useToast } from "@/features/ui/toast";
import { useEffect, useState } from "react";
import { useUploadCsvFile } from "../../../hooks/useCsvImport";
import { BankSelect } from "../../bank-select";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

type IUploadStepContentProps = {
  error: Error | null;
  file: File | null;
  setFile: (file: File | null) => void;
};

function UploadStepContent({ error, file, setFile }: IUploadStepContentProps) {
  const { selectedBank, setSelectedBank } = useTransactionImportContext();

  return (
    <div className="space-y-4">
      <div>
        <FileUploadInput
          label="Select CSV File"
          accept=".csv"
          files={file}
          onFilesChange={setFile}
        />
      </div>
      <div>
        <BankSelect
          value={selectedBank}
          onChange={setSelectedBank}
          helperText="Selecting a bank applies tailored column defaults during mapping."
        />
      </div>
      {error && (
        <div className="p-3 bg-danger/10 border border-danger rounded-2xl">
          <p className="text-sm text-danger">
            {error.message || "Upload failed"}
          </p>
        </div>
      )}
    </div>
  );
}

export function useUploadStep(): IStepConfig<IStep> {
  const { setColumns, setRows, setIsPending, rows, columns, currentStep } =
    useTransactionImportContext();
  const toast = useToast();

  // Local file state - only needed for upload, not stored in context
  const [file, setFile] = useState<File | null>(null);

  // Reset file when data is cleared (indicating resetAllState was called)
  useEffect(() => {
    if (currentStep === "upload" && rows.length === 0 && columns.length === 0) {
      setFile(null);
    }
  }, [rows.length, columns.length, currentStep]);

  const uploadMutation = useUploadCsvFile();

  return {
    title: "Upload CSV File",
    size: "lg",
    content: () => (
      <UploadStepContent
        error={uploadMutation.error}
        file={file}
        setFile={setFile}
      />
    ),
    footerButtons: (navigation: IStepNavigation<IStep>) => [
      {
        clicked: () => {
          if (!file) return;

          setIsPending(true);
          uploadMutation
            .mutateAsync(file)
            .then((result) => {
              setColumns(result.columns);
              setRows(result.rows);
              navigation.goToStep("mapping");
            })
            .catch(() => {
              toast.error("Upload failed");
            })
            .finally(() => {
              setIsPending(false);
            });
        },
        disabled: !file,
        variant: "primary",
        buttonContent: "Next",
      },
    ],
  };
}
