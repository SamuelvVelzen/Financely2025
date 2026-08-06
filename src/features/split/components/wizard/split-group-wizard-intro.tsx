import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import { HiOutlineGlobeAlt, HiOutlineUserGroup } from "react-icons/hi2";

export function SplitGroupWizardIntro() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <HiOutlineUserGroup className="size-8 text-primary" />
      </div>
      <Title className="text-3xl mb-4">Split expenses together</Title>
      <Text
        size="lg"
        isMuted
        className="max-w-md mx-auto">
        Perfect for shared trips or household costs. Track who paid what and
        settle up in one balance currency.
      </Text>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
        <div className="p-4 bg-surface rounded-2xl border border-border">
          <HiOutlineUserGroup className="size-5 mb-2 text-primary" />
          <Text className="font-medium">Shared groups</Text>
          <Text
            size="sm"
            isMuted
            className="mt-1">
            Invite friends or add guests with a link
          </Text>
        </div>
        <div className="p-4 bg-surface rounded-2xl border border-border">
          <HiOutlineGlobeAlt className="size-5 mb-2 text-primary" />
          <Text className="font-medium">Any currency</Text>
          <Text
            size="sm"
            isMuted
            className="mt-1">
            Log expenses abroad; we convert to your balance currency
          </Text>
        </div>
      </div>
    </div>
  );
}
