"use client";

import { cn } from "@/util/cn";
import { useCallback, useEffect, useRef, useState } from "react";
import { HiX } from "react-icons/hi";
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiExclamationTriangle,
  HiInformationCircle,
} from "react-icons/hi2";
import type { IToast, IToastPosition, IToastVariant } from "./types";

interface IToastProps {
  toast: IToast;
  onRemove: (id: string) => void;
}

const variantConfig: Record<
  IToastVariant,
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
};

function getAnimationClasses(position: IToastPosition, isExiting: boolean): string {
  const isLeft = position.includes("left");
  const isCenter = position.includes("center");
  const isTop = position.includes("top");

  if (isCenter) {
    // Center positions: slide down/up based on top/bottom
    if (isTop) {
      return isExiting
        ? "animate-[toastOutTop_300ms_ease-in-out_forwards]"
        : "animate-[toastInTop_300ms_ease-out]";
    }
    return isExiting
      ? "animate-[toastOutBottom_300ms_ease-in-out_forwards]"
      : "animate-[toastInBottom_300ms_ease-out]";
  }

  if (isLeft) {
    return isExiting
      ? "animate-[toastOutLeft_300ms_ease-in-out_forwards]"
      : "animate-[toastInLeft_300ms_ease-out]";
  }

  // Right positions (default)
  return isExiting
    ? "animate-[toastOutRight_300ms_ease-in-out_forwards]"
    : "animate-[toastInRight_300ms_ease-out]";
}

export function Toast({ toast, onRemove }: IToastProps) {
  const {
    id,
    message,
    variant,
    duration,
    title,
    showCloseButton,
    isExiting,
    position,
  } = toast;

  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef(duration);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = variantConfig[variant];
  const Icon = config.icon;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (duration === 0 || remainingTimeRef.current <= 0) return;

    clearTimer();
    startTimeRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      onRemove(id);
    }, remainingTimeRef.current);
  }, [duration, id, onRemove, clearTimer]);

  const pauseTimer = useCallback(() => {
    if (!startTimeRef.current) return;

    clearTimer();
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    startTimeRef.current = null;
  }, [clearTimer]);

  // Start timer on mount
  useEffect(() => {
    if (duration > 0 && !isExiting) {
      startTimer();
    }

    return clearTimer;
  }, [duration, isExiting, startTimer, clearTimer]);

  // Handle pause/resume
  useEffect(() => {
    if (isExiting) return;

    if (isPaused) {
      pauseTimer();
    } else if (duration > 0) {
      startTimer();
    }
  }, [isPaused, isExiting, duration, pauseTimer, startTimer]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleClose = () => {
    clearTimer();
    onRemove(id);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-2xl border shadow-lg min-w-[320px] max-w-[420px]",
        config.bg,
        config.border,
        getAnimationClasses(position, isExiting)
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.text)} />

      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn("font-semibold text-sm mb-1", config.text)}>
            {title}
          </p>
        )}
        <p className="text-sm text-text">{message}</p>
      </div>

      {showCloseButton && (
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            "flex-shrink-0 p-1 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer",
            config.text
          )}
          aria-label="Close notification"
        >
          <HiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
