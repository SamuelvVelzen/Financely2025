import { useMyProfile } from "@/features/users/hooks/useMyProfile";
import { cn } from "@/util/cn";
import { useMemo } from "react";
import { HiChevronRight } from "react-icons/hi2";
import { IconButton } from "../button/icon-button";
import { TextWithTooltip } from "../typography/text-with-tooltip";
import { useSidebar } from "./useSidebar";

const capitalizeFirst = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export function UserHeaderSidebar() {
  const { data: profile, isLoading } = useMyProfile();
  const { toggleSidebar, isExpanded } = useSidebar();

  const displayName = useMemo(() => {
    if (!profile) return null;

    return [
      capitalizeFirst(profile.firstName),
      profile.suffix,
      capitalizeFirst(profile.lastName),
    ]
      .filter(Boolean)
      .join(" ");
  }, [profile]);

  const expandedProfileCard = (
    <>
      {isLoading || !profile ? (
        <h2 className="text-2xl font-bold text-text mb-1 whitespace-nowrap truncate grow">
          <div>Loading...</div>
        </h2>
      ) : (
        <div className="flex-1 overflow-hidden">
          <h2 className="text-2xl font-bold text-text mb-1 whitespace-nowrap truncate">
            Hello <TextWithTooltip>{displayName}</TextWithTooltip>
          </h2>
          <p className="text-sm text-text-muted whitespace-nowrap truncate">
            <TextWithTooltip>{profile?.email}</TextWithTooltip>
          </p>
        </div>
      )}
    </>
  );

  return (
    <div className="flex w-full items-center justify-center gap-2 h-[56px]">
      {isExpanded && expandedProfileCard}
      <IconButton clicked={toggleSidebar} aria-label="Toggle sidebar">
        <HiChevronRight
          className={cn("size-7", isExpanded ? "rotate-180" : "")}
        />
      </IconButton>
    </div>
  );
}
