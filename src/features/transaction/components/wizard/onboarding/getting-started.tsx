import { HiCheck, HiSparkles } from "react-icons/hi2";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";

export function GettingStarted() {
  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-6">
          <HiSparkles className="size-8 text-success" />
        </div>
        <Title className="text-3xl mb-4">You&apos;re all set</Title>
        <Text
          size="lg"
          isMuted
          className="max-w-md mx-auto">
          Your account and workspace are ready. Here&apos;s what to do next.
        </Text>
      </div>

      <div className="space-y-4 max-w-lg mx-auto mt-12 text-left">
        <List>
          <ListItem className="gap-2 justify-start bg-success/5 border-success/20">
            <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center shrink-0 text-white">
              <HiCheck className="size-5" />
            </div>
            <Text className="text-success">Preferences and currency set</Text>
          </ListItem>

          <ListItem className="gap-2 justify-start bg-success/5 border-success/20">
            <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center shrink-0 text-white">
              <HiCheck className="size-5" />
            </div>
            <Text className="text-success">Ready to track transactions</Text>
          </ListItem>
        </List>

        <List>
          <ListItem className="gap-2 justify-start">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0 text-white font-bold">
              1
            </div>
            <Text>Create a budget to set spending limits</Text>
          </ListItem>

          <ListItem className="gap-2 justify-start">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0 text-white font-bold">
              2
            </div>
            <Text>Check your dashboard for spending insights</Text>
          </ListItem>

          <ListItem className="gap-2 justify-start">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0 text-white font-bold">
              3
            </div>
            <Text>
              Going on a trip? Use Splits for shared expenses and foreign
              currency
            </Text>
          </ListItem>
        </List>
      </div>

      <div className="mt-12">
        <Text
          isMuted
          size="sm">
          Click &quot;Complete&quot; below to go to your dashboard.
        </Text>
      </div>
    </div>
  );
}
