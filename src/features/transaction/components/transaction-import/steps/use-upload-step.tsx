import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { FileUploadInput } from "@/features/ui/input/file-upload-input";
import { BankSelect } from "../../bank-select";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

function UploadStepContent() {
  const { selectedBank, setSelectedBank, uploadMutation, file, setFile } =
    useTransactionImportContext();

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
      {uploadMutation.isError && (
        <div className="p-3 bg-danger/10 border border-danger rounded-lg">
          <p className="text-sm text-danger">
            {uploadMutation.error?.message || "Upload failed"}
          </p>
        </div>
      )}
    </div>
  );
}

export function useUploadStep(): IStepConfig<IStep> {
  const ctx = useTransactionImportContext();

  return {
    title: "Upload CSV File",
    size: "lg",
    content: () => <UploadStepContent />,
    footerButtons: (navigation: IStepNavigation<IStep>) => [
      {
        clicked: () => {
          if (!ctx.file) return;

          ctx.uploadMutation
            .mutateAsync(ctx.file)
            .then((result) => {
              ctx.setColumns(result.columns);
              navigation.goToStep("mapping");
            })
            .catch((error) => {
              console.error("Upload failed:", error);
            });
        },
        disabled: !ctx.file,
        variant: "primary",
        buttonContent: "Next",
      },
    ],
  };
}
