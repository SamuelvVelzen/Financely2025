import { useMyProfile } from "@/features/users/hooks/useMyProfile";
import { HiChevronLeft } from "react-icons/hi2";
import { TextWithTooltip } from "../typography/text-with-tooltip";
import { useSidebar } from "./useSidebar";

const capitalizeFirst = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export function UserHeaderSidebar() {
  const { data: profile, isLoading } = useMyProfile();
  const { toggleSidebar } = useSidebar();

  if (isLoading || !profile) {
    return (
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-text mb-1 whitespace-nowrap">
          Loading...
        </h2>
      </div>
    );
  }

  // Use display name or construct from parts
  const displayName = [
    capitalizeFirst(profile.firstName),
    profile.suffix,
    capitalizeFirst(profile.lastName),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className="flex-1 overflow-hidden">
        <h2 className="text-2xl font-bold text-text mb-1 whitespace-nowrap truncate">
          Hello <TextWithTooltip>{displayName}</TextWithTooltip>
        </h2>
        <p className="text-sm text-text-muted whitespace-nowrap truncate">
          <TextWithTooltip>{profile.email}</TextWithTooltip>
        </p>
      </div>
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex items-center justify-center w-8 h-8 rounded-2xl hover:bg-background motion-safe:transition-colors motion-safe:duration-300 shrink-0 cursor-pointer"
        aria-label="Collapse sidebar"
      >
        <HiChevronLeft className="w-5 h-5 text-text-muted" />
      </button>
    </>
  );
}
