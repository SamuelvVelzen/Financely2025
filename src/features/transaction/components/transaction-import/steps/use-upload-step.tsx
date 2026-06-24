import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { useToast } from "@/features/ui/toast";
import { useState } from "react";
import { useUploadCsvFile } from "../../../hooks/useCsvImport";
import { UploadStepContent } from "./upload-step-content";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

export function useUploadStep(): IStepConfig<IStep> {
  const {
    setColumns,
    setRows,
    setIsPending,
    uploadResetCounter,
  } = useTransactionImportContext();
  const toast = useToast();

  const [fileState, setFileState] = useState<{
    resetCounter: number;
    file: File | null;
  }>({ resetCounter: uploadResetCounter, file: null });

  if (fileState.resetCounter !== uploadResetCounter) {
    setFileState({ resetCounter: uploadResetCounter, file: null });
  }

  const file = fileState.file;
  const setFile = (nextFile: File | null) => {
    setFileState({ resetCounter: uploadResetCounter, file: nextFile });
  };

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
