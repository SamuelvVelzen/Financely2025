"use client";

import { IconButton } from "@/features/ui/button/icon-button";
import { cn } from "@/util/cn";
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
    multiple: multipleProp,
    ...rest
  } = props;
  const multiple = multipleProp ?? false;
  const inputId = useId();
  const resolvedId = id ?? inputId;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [internalFiles, setInternalFiles] = useState<File[]>(() => {
    if (props.multiple) {
      return props.defaultFiles ?? [];
    }
    return props.defaultFiles ? [props.defaultFiles] : [];
  });

  const selectedFiles = useMemo(() => {
    if (props.multiple) {
      return props.files ?? internalFiles;
    }
    if (props.files === undefined) {
      return internalFiles;
    }
    return props.files ? [props.files] : [];
  }, [props.multiple, props.files, internalFiles]);

  const handleFilesChange = (nextFiles: File[]) => {
    if (props.multiple) {
      if (props.files === undefined) {
        setInternalFiles(nextFiles);
      }
      props.onFilesChange?.(nextFiles);
    } else {
      const nextFile = nextFiles[0] ?? null;
      if (props.files === undefined) {
        setInternalFiles(nextFile ? [nextFile] : []);
      }
      props.onFilesChange?.(nextFile);
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
    if (props.multiple) {
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
      {label && (
        <label htmlFor={resolvedId} className="block text-sm font-medium">
          {label}
        </label>
      )}
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
          "block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover disabled:opacity-60",
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
              className="p-4 bg-surface-hover rounded-lg grid grid-cols-[1fr_auto] gap-2"
            >
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
                  aria-label={`Remove ${file.name}`}
                >
                  <HiX className="h-5 w-5" />
                </IconButton>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
