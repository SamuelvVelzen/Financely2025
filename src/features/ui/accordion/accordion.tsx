import { cn } from "@/features/util/cn";
import { type ReactNode, useState } from "react";
import { HiChevronDown } from "react-icons/hi2";

interface IAccordionProps {
  title: string;
  defaultOpen?: boolean;
  /** Controlled: when provided, open state is controlled by parent */
  open?: boolean;
  /** Called when open state changes (e.g. when user clicks to close). Use to e.g. close other accordions. */
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function Accordion({
  title,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
}: IAccordionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
      onOpenChange?.(next);
    }
  };

  return (
    <div className={cn("", className)}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center justify-between w-full py-2 text-left cursor-pointer group">
        <span className="text-text-muted tracking-wide font-medium group-hover:text-text transition-colors">
          {title}
        </span>
        <HiChevronDown
          className={cn(
            "size-4 text-text-muted transition-transform group-hover:text-text",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
