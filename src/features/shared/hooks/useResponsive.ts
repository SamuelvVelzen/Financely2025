import { useEffect, useState } from "react";

export type IDeviceType = "mobile" | "tablet" | "desktop";

export interface IUseResponsiveReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: IDeviceType;
}

/**
 * Hook to detect device type based on screen size
 * - Mobile: < 768px (below md breakpoint)
 * - Tablet: 768px - 1023px (md to lg breakpoint)
 * - Desktop: >= 1024px (lg and above)
 */
export function useResponsive(): IUseResponsiveReturn {
  // Default to desktop for SSR
  const [deviceType, setDeviceType] = useState<IDeviceType>(() => {
    if (typeof window === "undefined") return "desktop";

    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType("mobile");
      } else if (width < 1024) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };

    // Set initial value
    updateDeviceType();

    // Listen for resize events
    window.addEventListener("resize", updateDeviceType);
    return () => window.removeEventListener("resize", updateDeviceType);
  }, []);

  return {
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    deviceType,
  };
}
