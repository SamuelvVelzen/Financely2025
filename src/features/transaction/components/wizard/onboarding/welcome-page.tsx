import { Logo } from "@/features/ui/logo/logo";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import {
  HiArrowsRightLeft,
  HiOutlineBanknotes,
  HiOutlineTag
} from "react-icons/hi2";

export function WelcomePage() {
  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16  mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Logo className="size-8" />
        </div>
        <Title className="text-3xl mb-4">Welcome to Financely!</Title>
        <Text
          size="lg"
          isMuted
          className="max-w-md mx-auto">
          We're excited to help you take control of your finances. Let's take a
          quick tour to get you started.
        </Text>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mt-12">
        <div className="p-4 bg-surface rounded-2xl border border-border">
          <HiArrowsRightLeft className="size-6 mx-auto mb-2" />
          <Text className="font-medium">Track Expenses</Text>
        </div>
        <div className="p-4 bg-surface rounded-2xl border border-border">
          <HiOutlineTag className="size-6 mx-auto mb-2" />
          <Text className="font-medium">Organize with Tags</Text>
        </div>
        <div className="p-4 bg-surface rounded-2xl border border-border">
          <HiOutlineBanknotes className="size-6 mx-auto mb-2" />
          <Text className="font-medium">Set Budgets</Text>
        </div>
      </div>
    </div>
  );
}
