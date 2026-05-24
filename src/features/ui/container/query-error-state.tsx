import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { HiExclamationTriangle } from "react-icons/hi2";
import { Button } from "../button/button";

type IQueryErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
} & IPropsWithClassName;

export function QueryErrorState({
  title = "Unable to load data",
  message = "Something went wrong. Please try again.",
  onRetry,
  retryLabel = "Try again",
  className = "",
}: IQueryErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-4 py-8 text-center ${className}`}>
      <HiExclamationTriangle
        className="size-12 text-danger"
        aria-hidden
      />
      <div className="space-y-1">
        <p className="font-medium text-text">{title}</p>
        <p className="text-sm text-text-muted">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="primary"
          clicked={onRetry}
          buttonContent={retryLabel}
        />
      )}
    </div>
  );
}
