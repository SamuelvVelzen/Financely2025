import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { cn } from "@/features/util/cn";
import { HiPlus, HiUsers } from "react-icons/hi2";

export function SplitsOverviewHeader({
  onCreateClick,
}: {
  onCreateClick: () => void;
}) {
  const { isMobile } = useResponsive();
  const buttonSize = isMobile ? "xs" : "sm";

  return (
    <Container className="sticky z-10 top-0 mb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HiUsers className="size-6 shrink-0" />
          <div>
            <span className="text-xl font-bold">Splits</span>
            <p className="text-sm text-text-muted">Shared expenses with friends</p>
          </div>
        </div>

        {isMobile ? (
          <IconButton
            clicked={onCreateClick}
            variant="primary"
            size={buttonSize}
            ariaLabel="New split group">
            <HiPlus className="size-4" />
          </IconButton>
        ) : (
          <Button clicked={onCreateClick} variant="primary" size={buttonSize}>
            <HiPlus className={cn("size-5")} /> New group
          </Button>
        )}
      </div>
    </Container>
  );
}
