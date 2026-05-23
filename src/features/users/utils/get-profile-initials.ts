import type { IUserProfile } from "@/features/shared/validation/schemas";

export function getProfileInitials(profile: IUserProfile): string {
  const firstName = profile.firstName || "";
  const lastName = profile.lastName || "";
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();

  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`;
  }
  if (firstInitial) return firstInitial;
  if (lastInitial) return lastInitial;

  const emailInitial = profile.email?.charAt(0).toUpperCase();
  if (emailInitial) return emailInitial;

  return "?";
}
