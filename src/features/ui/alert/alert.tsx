"use client";

import { cn } from "@/util/cn";
import type { ReactNode } from "react";
import { HiQuestionMarkCircle } from "react-icons/hi";
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiExclamationTriangle,
  HiInformationCircle,
} from "react-icons/hi2";
import type { IVariant } from "../button/button";

interface IAlertProps {
  variant?: IVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const variantConfig: Record<
  IVariant,
  { bg: string; border: string; text: string; icon: React.ElementType }
> = {
  success: {
    bg: "bg-success-bg",
    border: "border-success",
    text: "text-success",
    icon: HiCheckCircle,
  },
  danger: {
    bg: "bg-danger-bg",
    border: "border-danger",
    text: "text-danger",
    icon: HiExclamationCircle,
  },
  info: {
    bg: "bg-info-bg",
    border: "border-info",
    text: "text-info",
    icon: HiInformationCircle,
  },
  warning: {
    bg: "bg-warning-bg",
    border: "border-warning",
    text: "text-warning",
    icon: HiExclamationTriangle,
  },
  default: {
    bg: "bg-surface",
    border: "border-border",
    text: "text-text",
    icon: HiQuestionMarkCircle,
  },
  primary: {
    bg: "bg-primary/5",
    border: "border-primary",
    text: "text-primary",
    icon: HiInformationCircle,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: IAlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-2 border-l-2 rounded-r",
        config.bg,
        config.border,
        className
      )}
      role="alert"
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.text)} />

      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn("font-semibold text-sm mb-1", config.text)}>
            {title}
          </p>
        )}
        <div className="text-sm text-text-muted">{children}</div>
      </div>
    </div>
  );
}

