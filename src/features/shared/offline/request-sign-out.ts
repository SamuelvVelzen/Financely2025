import { type ISignOutFromAppOptions } from "@/lib/auth-client";

export const SIGN_OUT_REQUEST_EVENT = "financely-sign-out-request";

export function requestSignOut(options?: ISignOutFromAppOptions): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SIGN_OUT_REQUEST_EVENT, { detail: options }),
  );
}
