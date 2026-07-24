import { cn } from "@/features/util/cn";
import type { ReactNode } from "react";

type ISplitSectionCardVariant = "primary" | "default";

type ISplitSectionCardProps = {
  variant?: ISplitSectionCardVariant;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
};

const variantClasses: Record<
  ISplitSectionCardVariant,
  { section: string; icon: string }
> = {
  primary: {
    section: "border-primary/20 bg-primary/5",
    icon: "bg-primary/15 text-primary",
  },
  default: {
    section: "border-border bg-surface/50",
    icon: "bg-surface-hover text-text-muted",
  },
};

export function SplitSectionCard({
  variant = "default",
  icon,
  title,
  description,
  children,
}: ISplitSectionCardProps) {
  const styles = variantClasses[variant];

  return (
    <section
      className={cn(
        "rounded-2xl border p-5 space-y-5",
        styles.section,
      )}>
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            styles.icon,
          )}>
          {icon}
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-base font-semibold text-text">{title}</h3>
          <p className="text-sm leading-relaxed text-text-muted mt-1.5">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
