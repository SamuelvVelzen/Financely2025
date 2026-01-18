import { useCallback, useRef, useState } from "react";

type IUseFileDragDropOptions = {
  onFileDrop: (file: File) => void;
  validateFile?: (file: File) => boolean;
};

type IUseFileDragDropReturn = {
  isDragging: boolean;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
};

/**
 * Validates a file based on extension and MIME type
 * During drag operations, MIME type may not be available, so we primarily rely on extension
 */
function validateCsvFile(file: File): boolean {
  // Check file extension (primary validation)
  const hasCsvExtension = file.name.toLowerCase().endsWith(".csv");

  if (!hasCsvExtension) {
    return false;
  }

  // If MIME type is empty or not provided (common during drag operations), accept based on extension
  if (file.type === "") {
    return true;
  }

  // If MIME type is provided, check if it matches common CSV MIME types
  const csvMimeTypes = [
    "text/csv",
    "application/csv",
    "text/comma-separated-values",
    "application/vnd.ms-excel",
  ];

  return csvMimeTypes.includes(file.type);
}

/**
 * Hook for handling file drag and drop functionality
 * Reuses patterns from use-sortable-list for consistency
 */
export function useFileDragDrop({
  onFileDrop,
  validateFile = validateCsvFile,
}: IUseFileDragDropOptions): IUseFileDragDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current += 1;

    // Check if files are being dragged by checking types
    // Firefox uses "Files" or "application/x-moz-file", Chrome/Safari use "Files"
    const hasFiles =
      e.dataTransfer.types.includes("Files") ||
      e.dataTransfer.types.includes("application/x-moz-file");

    if (hasFiles) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if files are being dragged
    const hasFiles =
      e.dataTransfer.types.includes("Files") ||
      e.dataTransfer.types.includes("application/x-moz-file");

    if (hasFiles) {
      // Always allow drop - validation happens on drop
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current -= 1;

    // Only reset when we've left the container completely
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        const isValid = validateFile(file);

        if (isValid) {
          onFileDrop(file);
        }
      }
    },
    [onFileDrop, validateFile]
  );

  return {
    isDragging,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
