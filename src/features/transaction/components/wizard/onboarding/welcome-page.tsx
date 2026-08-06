import { Logo } from "@/features/ui/logo/logo";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import {
  HiArrowsRightLeft,
  HiOutlineBanknotes,
  HiOutlineTag,
  HiOutlineUserGroup,
} from "react-icons/hi2";

export function WelcomePage() {
  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Logo className="size-8" />
        </div>
        <Title className="text-3xl mb-4">Welcome to Financely</Title>
        <Text
          size="lg"
          isMuted
          className="max-w-md mx-auto">
          Track day-to-day spending, organize with tags, and set budgets. When
          you travel, you can also split expenses across currencies — we&apos;ll
          cover that later if you need it.
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mt-12">
        <div className="p-4 bg-surface rounded-2xl border border-border">
          <HiArrowsRightLeft className="size-6 mx-auto mb-2" />
          <Text className="font-medium">Track expenses</Text>
          <Text
            size="sm"
            isMuted
            className="mt-1">
            Manual entry or CSV import from your bank
          </Text>
        </div>
        <div className="p-4 bg-surface rounded-2xl border border-border">
          <HiOutlineTag className="size-6 mx-auto mb-2" />
          <Text className="font-medium">Organize with tags</Text>
          <Text
            size="sm"
            isMuted
            className="mt-1">
            Categories that power budgets and insights
          </Text>
        </div>
        <div className="p-4 bg-surface rounded-2xl border border-border">
          <HiOutlineBanknotes className="size-6 mx-auto mb-2" />
          <Text className="font-medium">Set budgets</Text>
          <Text
            size="sm"
            isMuted
            className="mt-1">
            Spending limits for the categories you care about
          </Text>
        </div>
        <div className="p-4 bg-surface rounded-2xl border border-border">
          <HiOutlineUserGroup className="size-6 mx-auto mb-2" />
          <Text className="font-medium">Split trips (optional)</Text>
          <Text
            size="sm"
            isMuted
            className="mt-1">
            Shared expenses and foreign currency when you need them
          </Text>
        </div>
      </div>
    </div>
  );
}
