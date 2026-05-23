import { ROUTES } from "@/config/routes";
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
          redirect: location.pathname + location.search,
        },
      });
    }
  }, [isLoading, isError, error, navigate, location.pathname, location.search]);

  return {
    isLoading,
    initials: profile ? getProfileInitials(profile) : null,
  };
}
