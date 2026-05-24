export interface ISeedEnvironmentCheck {
  allowed: boolean;
  warning?: string;
  errorMessage?: string;
}

const DEFAULT_SEED_EMAIL = "dev@gmail.com";
const DEFAULT_SEED_PASSWORD = "devdevdev";

/**
 * Validates whether `yarn seed` may run in the current environment.
 */
export function checkSeedEnvironment(
  env: Record<string, string | undefined>,
): ISeedEnvironmentCheck {
  const isProduction = env.NODE_ENV === "production";

  if (!isProduction) {
    return { allowed: true };
  }

  const allowOverride = env.SEED_ALLOW_IN_PRODUCTION === "true";
  const passwordOverride = env.SEED_USER_PASSWORD?.trim();
  const emailOverride = env.SEED_USER_EMAIL?.trim();

  const hasSafeOverrides =
    allowOverride &&
    !!emailOverride &&
    emailOverride !== DEFAULT_SEED_EMAIL &&
    !!passwordOverride &&
    passwordOverride !== DEFAULT_SEED_PASSWORD &&
    passwordOverride.length >= 12;

  if (hasSafeOverrides) {
    return {
      allowed: true,
      warning:
        "Running seed in production with SEED_ALLOW_IN_PRODUCTION and custom credentials.",
    };
  }

  return {
    allowed: false,
    errorMessage:
      "Refusing to run seed in production. This script creates a demo user with well-known credentials (dev@gmail.com / devdevdev).",
  };
}
