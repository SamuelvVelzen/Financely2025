import { useLocation } from "@tanstack/react-router";

export function useIsActiveLink(href: string): { isActive: boolean } {
  const { pathname } = useLocation();

  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return {
    isActive,
  };
}
