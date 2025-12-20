/**
 * BetterAuth Configuration
 *
 * Central authentication configuration using BetterAuth.
 * Supports email/password, magic links, and social OAuth providers.
 */

import { prisma } from "@/util/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getAuthConfig } from "./auth-config";
import { EmailService } from "./email/email.service";

// Get environment variables with defaults
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
};

// Get auth configuration
const authConfig = getAuthConfig();
const {
  emailPassword: ENABLE_EMAIL_PASSWORD,
  magicLink: ENABLE_MAGIC_LINK,
  google: ENABLE_GOOGLE,
  microsoft: ENABLE_MICROSOFT,
  apple: ENABLE_APPLE,
} = authConfig;

// Base URL for auth callbacks
const baseURL = getEnv(
  "BETTER_AUTH_URL",
  process.env.BETTER_AUTH_URL || "http://localhost:3000"
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  secret: getEnv("BETTER_AUTH_SECRET"),
  baseURL,
  basePath: "/api/auth",

  // Configure custom model names to match our Prisma schema
  // UserInfo is now the BetterAuth user table
  user: {
    modelName: "UserInfo",
    additionalFields: {
      firstName: {
        type: "string",
        required: true,
      },
      lastName: {
        type: "string",
        required: true,
      },
      suffix: {
        type: "string",
        required: false,
      },
    },
    // Allow users to change their email
    changeEmail: {
      enabled: true,
    },
  },
  account: {
    modelName: "Account",
  },
  verification: {
    modelName: "Verification",
  },

  // Database hooks to auto-create User record on signup
  databaseHooks: {
    user: {
      create: {
        after: async (userInfo) => {
          // Create the app User record linked to this UserInfo
          await prisma.user.create({
            data: {
              userInfoId: userInfo.id,
            },
          });
        },
      },
    },
  },

  // Email and Password authentication
  emailAndPassword: ENABLE_EMAIL_PASSWORD
    ? {
        enabled: true,
        requireEmailVerification: true, // Always require email verification when email/password is enabled
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,
        sendResetPassword: async ({ user, url, token }) => {
          await EmailService.sendResetPasswordEmail({
            user: {
              id: user.id,
              email: user.email,
              name: user.name || undefined,
            },
            url,
            token,
          });
        },
        resetPasswordTokenExpiresIn: 3600, // 1 hour
        onPasswordReset: async ({ user }) => {
          // Update lastLoginAt on password reset if needed
          console.log(`Password reset for user: ${user.email}`);
        },
      }
    : undefined,

  // Email verification - always enabled when email/password auth is enabled
  emailVerification: ENABLE_EMAIL_PASSWORD
    ? {
        sendVerificationEmail: async ({ user, url, token }) => {
          // Use void to prevent timing attacks (BetterAuth recommendation)
          void EmailService.sendVerificationEmail({
            user: {
              id: user.id,
              email: user.email,
              name: user.name || undefined,
            },
            url,
            token,
          });
        },
        sendOnSignUp: true,
        sendOnSignIn: false, // Prevents auto-resend on login attempts
        autoSignInAfterVerification: true,
        expiresIn: 3600, // 1 hour
      }
    : undefined,

  // Social providers
  socialProviders: {
    ...(ENABLE_GOOGLE && {
      google: {
        clientId: getEnv("GOOGLE_CLIENT_ID", ""),
        clientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
      },
    }),
    ...(ENABLE_MICROSOFT && {
      microsoft: {
        clientId: getEnv("MICROSOFT_CLIENT_ID", ""),
        clientSecret: getEnv("MICROSOFT_CLIENT_SECRET", ""),
      },
    }),
    ...(ENABLE_APPLE && {
      apple: {
        clientId: getEnv("APPLE_CLIENT_ID", ""),
        clientSecret: getEnv("APPLE_CLIENT_SECRET", ""),
        // teamId: getEnv("APPLE_TEAM_ID", ""),
        // keyId: getEnv("APPLE_KEY_ID", ""),
      },
    }),
  },

  // Magic Link plugin
  plugins: [
    ...(ENABLE_MAGIC_LINK
      ? [
          magicLink({
            sendMagicLink: async ({ email, token, url }) => {
              // Find user for magic link
              const userInfo = await prisma.userInfo.findUnique({
                where: { email },
              });

              await EmailService.sendMagicLinkEmail({
                user: {
                  id: userInfo?.id || "new-user",
                  email,
                  name: userInfo?.name || undefined,
                },
                url,
                token,
              });
            },
            disableSignUp: false, // Allow automatic signup via magic link
          }),
        ]
      : []),
    // TanStack Start cookies plugin - must be last
    tanstackStartCookies(),
  ],

  // Session configuration
  session: {
    modelName: "Session",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },

  // Advanced configuration
  advanced: {
    cookiePrefix: "better-auth",
  },
});
