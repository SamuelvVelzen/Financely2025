import { ApiClientError } from "@/features/shared/api/client";

export function isInvalidShareLinkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  if (error.message === "Invalid share link") {
    return true;
  }
  return (
    error instanceof ApiClientError &&
    (error.code === "NOT_FOUND" || error.message.includes("Invalid share link"))
  );
}
