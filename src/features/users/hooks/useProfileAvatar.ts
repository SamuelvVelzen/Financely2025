import { ROUTES } from "@/config/routes";
import { getAuthRedirectPath } from "@/features/auth/sanitize-auth-redirect";
import { ApiClientError } from "@/features/shared/api/client";
import { ErrorCodes } from "@/features/shared/api/errors";
import { getProfileInitials } from "@/features/users/utils/get-profile-initials";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMyProfile } from "./useMyProfile";

export function useProfileAvatar() {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const { data: profile, isLoading, isError, error } = useMyProfile();

  useEffect(() => {
    if (isLoading || !isError) return;

    const isUnauthorized =
      (error instanceof ApiClientError &&
        error.code === ErrorCodes.UNAUTHORIZED) ||
      error?.message === "Unauthorized";

    if (isUnauthorized) {
      void navigate({
        to: ROUTES.LOGIN,
        search: {
          redirect: getAuthRedirectPath(location),
        },
      });
    }
  }, [isLoading, isError, error, navigate, location]);

  return {
    isLoading,
    initials: profile ? getProfileInitials(profile) : null,
  };
}
