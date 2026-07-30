import { Button } from "@/features/ui/button/button";
import { LinkButton } from "@/features/ui/button/link-button";
import {
  HiArrowDownTray,
  HiArrowUpOnSquare,
  HiPlus,
  HiXMark,
} from "react-icons/hi2";
import { usePwaInstallPrompt } from "./use-pwa-install-prompt";

export function PwaInstallPrompt() {
  const { isVisible, variant, install, dismiss } = usePwaInstallPrompt();

  if (!isVisible || variant == null) return null;

  const isIos = variant === "ios";

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-[60] md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
      role="region"
      aria-label={isIos ? "Add Financely to Home Screen" : "Install Financely"}>
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white">
            {isIos ? (
              <HiArrowUpOnSquare className="size-5" aria-hidden />
            ) : (
              <HiArrowDownTray className="size-5" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text">
              {isIos ? "Add to Home Screen" : "Install Financely"}
            </p>
            {isIos ? (
              <>
                <p className="mt-1 text-sm text-text-muted">
                  Install Financely from Safari for faster access and offline
                  use.
                </p>
                <ol className="mt-3 space-y-2 text-sm text-text">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold text-text-muted">
                      1
                    </span>
                    <span>
                      Tap{" "}
                      <HiArrowUpOnSquare
                        className="mx-0.5 inline size-4 align-text-bottom text-primary"
                        aria-hidden
                      />{" "}
                      <span className="font-medium">Share</span> in the toolbar
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold text-text-muted">
                      2
                    </span>
                    <span>
                      Choose{" "}
                      <span className="inline-flex items-center gap-1 font-medium">
                        <HiPlus
                          className="inline size-4 align-text-bottom text-primary"
                          aria-hidden
                        />
                        Add to Home Screen
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold text-text-muted">
                      3
                    </span>
                    <span>
                      Tap <span className="font-medium">Add</span>
                    </span>
                  </li>
                </ol>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    buttonContent="Got it"
                    clicked={dismiss}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-text-muted">
                  Add it to your home screen for faster access and offline use.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    buttonContent="Install"
                    clicked={() => {
                      void install();
                    }}
                  />
                  <LinkButton
                    size="sm"
                    appearance="outlined"
                    buttonContent="Not now"
                    clicked={dismiss}
                  />
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            className="rounded-xl p-1 text-text-muted hover:bg-surface-hover hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Dismiss install prompt"
            onClick={dismiss}>
            <HiXMark className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
