import { cn } from "@/features/util/cn";
import { HiCloudUpload } from "react-icons/hi";

type IFileDragOverlayProps = {
  className?: string;
};

/**
 * Overlay component displayed when dragging files over the drop zone
 * Shows generic visual feedback with border, background, text, and icon
 */
export function FileDragOverlay({ className }: IFileDragOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10",
        "border-2 border-dashed border-primary bg-primary/40 backdrop-blur-xs",
        "rounded-2xl",
        "flex flex-col items-center justify-center gap-3",
        "motion-safe:transition-all",
        className
      )}>
      <HiCloudUpload className="size-12 text-primary" />
      <p className="text-lg font-semibold text-primary">Drop your file here</p>
    </div>
  );
}
