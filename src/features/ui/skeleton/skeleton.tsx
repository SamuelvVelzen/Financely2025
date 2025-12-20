import { cn } from "@/util/cn";

export interface ISkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean | "full" | "lg" | "md" | "sm";
}

export function Skeleton({
  className = "",
  width,
  height,
  rounded = true,
}: ISkeletonProps) {
  const roundedClass =
    rounded === true
      ? "rounded"
      : rounded === "full"
        ? "rounded-full"
        : rounded === "lg"
          ? "rounded-lg"
          : rounded === "md"
            ? "rounded-md"
            : rounded === "sm"
              ? "rounded-sm"
              : "";

  const style: React.CSSProperties = {};
  if (width) {
    style.width = typeof width === "number" ? `${width}px` : width;
  }
  if (height) {
    style.height = typeof height === "number" ? `${height}px` : height;
  }

  return (
    <div
      className={cn("animate-pulse bg-surface-hover", roundedClass, className)}
      style={style}
    />
  );
}
