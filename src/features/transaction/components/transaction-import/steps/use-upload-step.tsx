import { Alert } from "@/features/ui/alert/alert";
import { LinkButton } from "@/features/ui/button/link-button";
import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { FileUploadInput } from "@/features/ui/input/file-upload-input";
import { useToast } from "@/features/ui/toast";
import { useEffect, useState } from "react";
import { useUploadCsvFile } from "../../../hooks/useCsvImport";
import { BankProfileFactory } from "../../../services/bank.factory";
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

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
    
    if (newFile) {
      // Auto-detect bank from filename when file is selected
      const detectedBank = BankProfileFactory.detectBankByFilename(newFile.name);
      if (detectedBank) {
        setSelectedBank(detectedBank);
      }
    } else {
      // Reset bank to default when file is removed
      setSelectedBank("DEFAULT");
    }
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/transaction-template.csv";
    link.download = "transaction-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showDefaultTemplateHint = selectedBank === "DEFAULT";

  return (
    <div className="space-y-4">
      <div>
        <FileUploadInput
          label="Select CSV File"
          accept=".csv"
          files={file}
          onFilesChange={handleFileChange}
        />
      </div>
      <div>
        <BankSelect
          value={selectedBank}
          onChange={setSelectedBank}
          helperText="Selecting a bank applies tailored column defaults during mapping."
        />
      </div>
      {showDefaultTemplateHint && (
        <Alert variant="primary">
          <div className="space-y-1">
            <p>
              Using the default template with structured columns. Download the
              template CSV file to see the required column format.
            </p>
            <LinkButton
              clicked={handleDownloadTemplate}
              variant="primary">
              Download CSV Template
            </LinkButton>
          </div>
        </Alert>
      )}
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
