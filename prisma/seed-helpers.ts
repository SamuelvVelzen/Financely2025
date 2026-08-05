/** Known weak credentials — must never be created in production. */
export const DEFAULT_SEED_EMAIL = "dev@gmail.com";
export const DEFAULT_SEED_PASSWORD = "devdevdev";
export const DEFAULT_SEED_FIRST_NAME = "Demo";
export const DEFAULT_SEED_LAST_NAME = "User";

export function isProductionBootstrap(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.NODE_ENV === "production";
}

export function resolveSeedIdentity(
  env: Record<string, string | undefined> = process.env,
): {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isProduction: boolean;
} {
  const isProduction = isProductionBootstrap(env);
  return {
    email: (env.SEED_USER_EMAIL?.trim() || DEFAULT_SEED_EMAIL).toLowerCase(),
    password: env.SEED_USER_PASSWORD?.trim() || DEFAULT_SEED_PASSWORD,
    firstName:
      env.SEED_USER_FIRST_NAME?.trim() ||
      (isProduction ? "Admin" : DEFAULT_SEED_FIRST_NAME),
    lastName:
      env.SEED_USER_LAST_NAME?.trim() ||
      (isProduction ? "User" : DEFAULT_SEED_LAST_NAME),
    isProduction,
  };
}
