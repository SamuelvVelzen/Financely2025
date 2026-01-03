"use client";

import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useId, useMemo } from "react";
import { IVariant } from "../button/button";

export type ISpinnerSize = "sm" | "md" | "lg";

export type ISpinnerProps = {
  size?: ISpinnerSize;
  variant?: IVariant;
} & IPropsWithClassName;

const VARIANT_TO_COLOR = {
  default: "color-mix(in srgb, var(--color-primary) 80%, black 20%)",
  danger: "color-mix(in srgb, var(--color-danger) 80%, black 20%)",
  info: "color-mix(in srgb, var(--color-info) 80%, black 20%)",
  warning: "color-mix(in srgb, var(--color-warning) 80%, black 20%)",
  success: "color-mix(in srgb, var(--color-success) 80%, black 20%)",
  primary: "color-mix(in srgb, var(--color-primary) 80%, black 20%)",
  secondary: "color-mix(in srgb, var(--color-secondary) 80%, black 20%)",
};

// Pre-calculated constants for better performance
const SPINNER_CONFIG = {
  sm: {
    size: 16,
    strokeWidth: 2,
    containerSize: "size-4",
    dashArray: 17.6, // Math.PI * (16 - 2) * 0.4 (40% visible, 60% gap)
    dashOffset: 44.0, // Math.PI * (16 - 2)
  },
  md: {
    size: 40,
    strokeWidth: 4,
    containerSize: "size-10",
    dashArray: 45.2, // Math.PI * (40 - 4) * 0.4 (40% visible, 60% gap)
    dashOffset: 113.1, // Math.PI * (40 - 4)
  },
  lg: {
    size: 64,
    strokeWidth: 6,
    containerSize: "size-16",
    dashArray: 72.9, // Math.PI * (64 - 6) * 0.4 (40% visible, 60% gap)
    dashOffset: 182.2, // Math.PI * (64 - 6)
  },
} as const;

export function Spinner({
  size = "md",
  className = "",
  variant = "primary",
}: ISpinnerProps) {
  const gradientId = useId(); // Generate unique ID per component instance

  const config = useMemo(() => SPINNER_CONFIG[size], [size]);
  const color = useMemo(() => VARIANT_TO_COLOR[variant], [variant]);

  const center = config.size / 2;
  const radius = (config.size - config.strokeWidth) / 2;

  return (
    <div
      className={`relative ${config.containerSize} ${className}`}
      aria-hidden="true">
      <svg
        className="absolute inset-0 animate-spinner-rotate"
        width={config.size}
        height={config.size}
        viewBox={`0 0 ${config.size} ${config.size}`}
        style={{
          transformOrigin: "center",
          willChange: "transform",
        }}>
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%">
            <stop
              offset="0%"
              stopColor={color}
            />
            <stop
              offset="50%"
              stopColor={color}
              stopOpacity={0.5}
            />
            <stop
              offset="100%"
              stopColor={color}
            />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${config.dashArray} ${config.dashOffset}`}
        />
      </svg>
    </div>
  );
}
