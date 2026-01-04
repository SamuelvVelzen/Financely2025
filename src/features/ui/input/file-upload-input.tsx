import { IconButton } from "@/features/ui/button/icon-button";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { useId, useMemo, useRef, useState } from "react";
import { HiX } from "react-icons/hi";

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "multiple" | "value" | "defaultValue" | "onChange"
>;

type SharedProps = NativeInputProps & {
  label?: string;
  helperText?: string;
  allowClear?: boolean;
};

type SingleFileProps = SharedProps & {
  multiple?: false;
  files?: File | null;
  defaultFiles?: File | null;
  onFilesChange?: (file: File | null) => void;
};

type MultiFileProps = SharedProps & {
  multiple: true;
  files?: File[];
  defaultFiles?: File[];
  onFilesChange?: (files: File[]) => void;
};

export type FileUploadInputProps = SingleFileProps | MultiFileProps;

export function FileUploadInput(props: FileUploadInputProps) {
  const {
    label,
    helperText,
    accept = ".csv",
    disabled,
    className,
    allowClear = true,
    name,
    id,
    multiple = false,
    files,
    defaultFiles,
    onFilesChange,
    ...rest
  } = props;
  const inputId = useId();
  const resolvedId = id ?? inputId;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [internalFiles, setInternalFiles] = useState<File[]>(() => {
    if (multiple) {
      return (defaultFiles as File[] | undefined) ?? [];
    }
    return defaultFiles ? [defaultFiles as File] : [];
  });

  const selectedFiles = useMemo(() => {
    if (multiple) {
      return (files as File[] | undefined) ?? internalFiles;
    }
    if (files === undefined) {
      return internalFiles;
    }
    return files ? [files as File] : [];
  }, [multiple, files, internalFiles]);

  const handleFilesChange = (nextFiles: File[]) => {
    if (multiple) {
      if (files === undefined) {
        setInternalFiles(nextFiles);
      }
      (onFilesChange as ((files: File[]) => void) | undefined)?.(nextFiles);
    } else {
      const nextFile = nextFiles[0] ?? null;
      if (files === undefined) {
        setInternalFiles(nextFile ? [nextFile] : []);
      }
      (onFilesChange as ((file: File | null) => void) | undefined)?.(nextFile);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosenFiles = Array.from(event.target.files ?? []);
    const nextFiles = multiple ? chosenFiles : chosenFiles.slice(0, 1);
    handleFilesChange(nextFiles);
    // Allow selecting the same file again after clearing
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    if (multiple) {
      const nextFiles = selectedFiles.filter((_, i) => i !== index);
      handleFilesChange(nextFiles);
    } else {
      handleFilesChange([]);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const formattedFiles = useMemo(
    () =>
      selectedFiles.map((file) => ({
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type,
      })),
    [selectedFiles]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {label && <Label htmlFor={resolvedId}>{label}</Label>}
      <input
        ref={inputRef}
        id={resolvedId}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
        className={cn(
          "block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover disabled:opacity-60",
          disabled && "cursor-not-allowed opacity-60"
        )}
        {...rest}
      />
      {helperText && <p className="text-xs text-text-muted">{helperText}</p>}
      {formattedFiles.length > 0 && (
        <div className="space-y-2">
          {formattedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="p-4 bg-surface-hover rounded-2xl grid grid-cols-[1fr_auto] gap-2">
              <div>
                <p className="text-sm">
                  <span className="font-medium">File:</span> {file.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Size:</span> {file.size}
                </p>
              </div>
              {allowClear && (
                <IconButton
                  className="self-center justify-self-end"
                  clicked={() => handleRemoveFile(index)}
                  disabled={disabled}
                  aria-label={`Remove ${file.name}`}>
                  <HiX className="size-5" />
                </IconButton>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
