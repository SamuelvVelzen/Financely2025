import { Skeleton } from "./skeleton";

export interface ISkeletonTitleProps {
  className?: string;
  width?: string | number;
}

export function SkeletonTitle({
  className = "",
  width = 200,
}: ISkeletonTitleProps) {
  return (
    <Skeleton
      height={32}
      width={width}
      className={`h-8 ${className}`}
    />
  );
}

