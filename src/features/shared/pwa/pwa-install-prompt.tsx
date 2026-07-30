import { Button } from "@/features/ui/button/button";
import { LinkButton } from "@/features/ui/button/link-button";
import { HiArrowDownTray, HiXMark } from "react-icons/hi2";
import { usePwaInstallPrompt } from "./use-pwa-install-prompt";

export function PwaInstallPrompt() {
  const { isVisible, install, dismiss } = usePwaInstallPrompt();

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-[60] md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
      role="region"
      aria-label="Install Financely">
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white">
            <HiArrowDownTray className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text">Install Financely</p>
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
