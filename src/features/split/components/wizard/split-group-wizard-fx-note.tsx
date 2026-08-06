import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import { HiArrowsRightLeft } from "react-icons/hi2";

export function SplitGroupWizardFxNote() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <HiArrowsRightLeft className="size-8 text-primary" />
      </div>
      <Title className="text-3xl mb-4">Foreign currencies</Title>
      <Text
        size="lg"
        isMuted
        className="max-w-md mx-auto">
        The balance currency is what you settle in. Individual expenses can use
        other currencies — Financely converts them using exchange rates so
        everyone stays fair.
      </Text>
    </div>
  );
}
