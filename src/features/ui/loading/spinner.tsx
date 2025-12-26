"use client";

import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useMemo } from "react";

export type ISpinnerSize = "sm" | "md" | "lg";

export type ISpinnerProps = {
  size?: ISpinnerSize;
} & IPropsWithClassName;

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

export function Spinner({ size = "md", className = "" }: ISpinnerProps) {
  const config = useMemo(() => SPINNER_CONFIG[size], [size]);

  const center = config.size / 2;
  const radius = (config.size - config.strokeWidth) / 2;
  const gradientId = `gradient-${size}`;

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
              stopColor="var(--color-primary)"
            />
            <stop
              offset="50%"
              stopColor="var(--color-secondary)"
            />
            <stop
              offset="100%"
              stopColor="var(--color-primary)"
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
