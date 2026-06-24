import { Alert } from "@/features/ui/alert/alert";
import { LinkButton } from "@/features/ui/button/link-button";
import { FileDragOverlay } from "@/features/ui/input/file-drag-overlay";
import { FileUploadInput } from "@/features/ui/input/file-upload-input";
import { useFileDragDrop } from "@/features/ui/input/hooks/use-file-drag-drop";
import { cn } from "@/features/util/cn";
import { BankProfileFactory } from "../../../services/bank.factory";
import { BankSelect } from "../../bank-select";
import { useTransactionImportContext } from "./transaction-import-context";

type IUploadStepContentProps = {
  error: Error | null;
  file: File | null;
  setFile: (file: File | null) => void;
};

export function UploadStepContent({
  error,
  file,
  setFile,
}: IUploadStepContentProps) {
  const { selectedBank, setSelectedBank } = useTransactionImportContext();

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);

    if (newFile) {
      const detectedBank = BankProfileFactory.detectBankByFilename(
        newFile.name
      );
      if (detectedBank) {
        setSelectedBank(detectedBank);
      }
    } else {
      setSelectedBank("DEFAULT");
    }
  };

  const handleFileDrop = (droppedFile: File) => {
    handleFileChange(droppedFile);
  };

  const {
    isDragging,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useFileDragDrop({
    onFileDrop: handleFileDrop,
  });

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
    <div
      className={cn("relative", isDragging && "min-h-[200px]")}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}>
      {isDragging && <FileDragOverlay />}
      <div className="space-y-4">
        <div>
          <FileUploadInput
            label="Select CSV File"
            accept=".csv"
            files={file}
            onFilesChange={handleFileChange}
            hint="Only CSV files are allowed"
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
                variant="primary"
                appearance="outlined">
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
    </div>
  );
}
