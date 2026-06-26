type OverlayEscapeRegistration = {
  isActive: () => boolean;
  dismissible: boolean;
  onEscape: () => void;
};

const overlayEscapeRegistrations: OverlayEscapeRegistration[] = [];
let escapeListenerAttached = false;

function getTopmostOpenDropdownPopover(): HTMLElement | null {
  const openDropdownPopovers = document.querySelectorAll<HTMLElement>(
    "[data-dropdown-content]:popover-open",
  );
  if (openDropdownPopovers.length === 0) return null;
  return openDropdownPopovers[openDropdownPopovers.length - 1];
}

function handleDocumentEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;

  const topmostDropdown = getTopmostOpenDropdownPopover();
  if (topmostDropdown) {
    topmostDropdown.hidePopover();
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  for (let index = overlayEscapeRegistrations.length - 1; index >= 0; index--) {
    const registration = overlayEscapeRegistrations[index];
    if (!registration.isActive()) continue;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (registration.dismissible) {
      registration.onEscape();
    }
    return;
  }
}

function ensureEscapeListener() {
  if (escapeListenerAttached || typeof document === "undefined") return;
  document.addEventListener("keydown", handleDocumentEscape, true);
  escapeListenerAttached = true;
}

export function registerOverlayEscapeHandler(
  registration: OverlayEscapeRegistration,
): () => void {
  ensureEscapeListener();
  overlayEscapeRegistrations.push(registration);

  return () => {
    const index = overlayEscapeRegistrations.indexOf(registration);
    if (index >= 0) {
      overlayEscapeRegistrations.splice(index, 1);
    }
  };
}

export function hasOpenDropdownPopover(): boolean {
  if (typeof document === "undefined") return false;
  return getTopmostOpenDropdownPopover() != null;
}
