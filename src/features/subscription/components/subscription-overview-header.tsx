import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { cn } from "@/features/util/cn";
import { HiArrowPath, HiMagnifyingGlass } from "react-icons/hi2";

export interface IActionHandlers {
  onDetectSubscriptions: () => void;
}

export interface ISubscriptionOverviewHeaderProps {
  actions: IActionHandlers;
  isSticky: boolean;

}

export function SubscriptionOverviewHeader({
  actions,
  isSticky,

}: ISubscriptionOverviewHeaderProps) {
  const { isMobile } = useResponsive();
  const buttonSize = isMobile ? "xs" : "sm";
  const iconClass = isMobile ? "size-4" : isSticky ? "size-5" : "size-6";

  return (
    <Container className={cn("sticky z-10 top-0 transition-all")}>
      <div className="flex items-center justify-between gap-2 transition-all">
        <div className="flex gap-2 items-center">
          <HiArrowPath
            className={cn(
              "shrink-0 transition-all",
              isSticky ? "size-5" : "size-6",
            )}
          />
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "transition-all",
                isSticky ? "text-base font-semibold" : "text-xl font-bold",
              )}>
              Subscriptions
            </span>
          </div>
        </div>

        <Button
          clicked={actions.onDetectSubscriptions}
          variant="primary"
          size={buttonSize}
          buttonContent={
            <div className="flex items-center gap-1.5">
              <HiMagnifyingGlass className={iconClass} />
              {isMobile || isSticky ? "Detect" : "Detect Subscriptions"}
            </div>
          }
        />
      </div>
    </Container>
  );
}
