import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import { HiCheck, HiSparkles } from "react-icons/hi2";

export function SplitGroupWizardReady() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-6">
        <HiSparkles className="size-8 text-success" />
      </div>
      <Title className="text-3xl mb-4">Group ready</Title>
      <Text
        size="lg"
        isMuted
        className="max-w-md mx-auto">
        Add your first shared expense whenever you&apos;re ready. Completing
        takes you to the group.
      </Text>
      <div className="mt-8 inline-flex items-center gap-2 text-success">
        <HiCheck className="size-5" />
        <Text className="text-success">Click Complete to open the group</Text>
      </div>
    </div>
  );
}
