import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { useToast } from "@/features/ui/toast";
import { ScrollableHeader } from "@/features/ui/typography/scrollable-header";
import {
  useConnectedAccounts,
  useLinkSocialAccount,
  useUnlinkAccount,
} from "@/features/users/hooks/useConnectedAccounts";
import { getEnabledSocialProviders } from "@/lib/auth-config";
import { useState } from "react";

// Provider display info
const PROVIDER_INFO: Record<
  string,
  { name: string; icon: React.ReactNode; color: string }
> = {
  google: {
    name: "Google",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    color: "text-[#4285F4]",
  },
  microsoft: {
    name: "Microsoft",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24">
        <path
          fill="#F25022"
          d="M1 1h10v10H1z"
        />
        <path
          fill="#00A4EF"
          d="M1 13h10v10H1z"
        />
        <path
          fill="#7FBA00"
          d="M13 1h10v10H13z"
        />
        <path
          fill="#FFB900"
          d="M13 13h10v10H13z"
        />
      </svg>
    ),
    color: "text-text",
  },
  apple: {
    name: "Apple",
    icon: (
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    color: "text-text",
  },
  credential: {
    name: "Password",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    color: "text-text-muted",
  },
};

export function ConnectedAccounts() {
  const { data: accountsData } = useConnectedAccounts();
  const unlinkAccount = useUnlinkAccount();
  const linkSocial = useLinkSocialAccount();
  const toast = useToast();
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleUnlinkAccount = async (accountId: string) => {
    setUnlinkingId(accountId);
    try {
      await unlinkAccount.mutateAsync(accountId);
      toast.success("Account disconnected");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to disconnect account"
      );
    } finally {
      setUnlinkingId(null);
    }
  };

  const handleLinkSocial = async (
    provider: "google" | "microsoft" | "apple"
  ) => {
    try {
      await linkSocial.mutateAsync({ provider });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to connect ${provider}`
      );
    }
  };

  // Get available social providers from auth config
  const AVAILABLE_PROVIDERS = getEnabledSocialProviders();

  // Get connected provider IDs
  const connectedProviderIds =
    accountsData?.accounts.map((a) => a.providerId) || [];
  const availableToConnect = AVAILABLE_PROVIDERS.filter(
    (p) => !connectedProviderIds.includes(p)
  );

  return (
    <Container className="mb-4">
      <ScrollableHeader
        id="connected-accounts"
        className="mb-4">
        Connected Accounts
      </ScrollableHeader>
      <p className="text-sm text-text-muted mb-4">
        Manage your connected login methods. You must keep at least one method
        to sign in.
      </p>

      {/* Connected accounts list */}
      <div className="space-y-3 mb-4">
        {accountsData?.accounts.map((account) => {
          const info = PROVIDER_INFO[account.providerId] || {
            name: account.providerId,
            icon: null,
            color: "text-text",
          };
          const canUnlink = (accountsData?.accounts.length || 0) > 1;

          return (
            <div
              key={account.id}
              className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <span className={info.color}>{info.icon}</span>
                <div>
                  <p className="font-medium text-text">{info.name}</p>
                  <p className="text-xs text-text-muted">
                    Connected {formatDate(account.createdAt)}
                  </p>
                </div>
              </div>
              {account.providerId !== "credential" && (
                <Button
                  variant="danger"
                  size="sm"
                  clicked={() => handleUnlinkAccount(account.id)}
                  disabled={!canUnlink || unlinkingId === account.id}>
                  {unlinkingId === account.id
                    ? "Disconnecting..."
                    : "Disconnect"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Available to connect */}
      {availableToConnect.length > 0 && (
        <>
          <p className="text-sm font-medium text-text mb-2">
            Connect another account
          </p>
          <div className="flex flex-wrap gap-2">
            {availableToConnect.map((provider) => {
              const info = PROVIDER_INFO[provider];
              return (
                <Button
                  key={provider}
                  variant="default"
                  clicked={() => handleLinkSocial(provider)}
                  disabled={linkSocial.isPending}
                  className="whitespace-nowrap flex-1">
                  <span className={`mr-2 ${info.color}`}>{info.icon}</span>
                  Connect {info.name}
                </Button>
              );
            })}
          </div>
        </>
      )}
    </Container>
  );
}
