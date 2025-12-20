import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { FileUploadInput } from "@/features/ui/input/file-upload-input";
import { useToast } from "@/features/ui/toast";
import { useUploadCsvFile } from "../../../hooks/useCsvImport";
import { BankSelect } from "../../bank-select";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

type IUploadStepContentProps = {
  error: Error | null;
};

function UploadStepContent({ error }: IUploadStepContentProps) {
  const { selectedBank, setSelectedBank, file, setFile } =
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
      {error && (
        <div className="p-3 bg-danger/10 border border-danger rounded-lg">
          <p className="text-sm text-danger">
            {error.message || "Upload failed"}
          </p>
        </div>
      )}
    </div>
  );
}

export function useUploadStep(): IStepConfig<IStep> {
  const { file, setColumns, setIsPending } = useTransactionImportContext();
  const toast = useToast();

  const uploadMutation = useUploadCsvFile();

  return {
    title: "Upload CSV File",
    size: "lg",
    content: () => <UploadStepContent error={uploadMutation.error} />,
    footerButtons: (navigation: IStepNavigation<IStep>) => [
      {
        clicked: () => {
          if (!file) return;

          setIsPending(true);
          uploadMutation
            .mutateAsync(file)
            .then((result) => {
              setColumns(result.columns);
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
