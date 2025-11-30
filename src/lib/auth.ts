/**
 * BetterAuth Configuration
 * 
 * Central authentication configuration using BetterAuth.
 * Supports email/password, magic links, and social OAuth providers.
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { createAuthMiddleware } from "better-auth/api";
import { prisma } from "@/util/prisma";
import { EmailService } from "./email/email.service";
import { syncUserToAppUser, updateLastLoginAt } from "@/features/auth/services/user-sync.service";

// Get environment variables with defaults
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
};

// Feature flags for auth methods
const ENABLE_EMAIL_PASSWORD = process.env.ENABLE_EMAIL_PASSWORD !== "false";
const ENABLE_MAGIC_LINK = process.env.ENABLE_MAGIC_LINK !== "false";
const ENABLE_GOOGLE = process.env.ENABLE_GOOGLE === "true";
const ENABLE_MICROSOFT = process.env.ENABLE_MICROSOFT === "true";
const ENABLE_APPLE = process.env.ENABLE_APPLE === "true";
const REQUIRE_EMAIL_VERIFICATION = process.env.REQUIRE_EMAIL_VERIFICATION === "true";

// Base URL for auth callbacks
const baseURL = getEnv("BETTER_AUTH_URL", process.env.BETTER_AUTH_URL || "http://localhost:3000");

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  secret: getEnv("BETTER_AUTH_SECRET"),
  baseURL,
  basePath: "/api/auth",
  
  // Email and Password authentication
  emailAndPassword: ENABLE_EMAIL_PASSWORD
    ? {
        enabled: true,
        requireEmailVerification: REQUIRE_EMAIL_VERIFICATION,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,
        sendResetPassword: async ({ user, url, token }, request) => {
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
        onPasswordReset: async ({ user }, request) => {
          // Update lastLoginAt on password reset if needed
          console.log(`Password reset for user: ${user.email}`);
        },
      }
    : undefined,

  // Email verification
  emailVerification: REQUIRE_EMAIL_VERIFICATION
    ? {
        sendVerificationEmail: async ({ user, url, token }, request) => {
          await EmailService.sendVerificationEmail({
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
        sendOnSignIn: false,
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
        teamId: getEnv("APPLE_TEAM_ID", ""),
        keyId: getEnv("APPLE_KEY_ID", ""),
      },
    }),
  },

  // Magic Link plugin
  plugins: [
    ...(ENABLE_MAGIC_LINK
      ? [
          magicLink({
            sendMagicLink: async ({ email, token, url }, ctx) => {
              // Find or create user for magic link
              const user = await prisma.betterAuthUser.findUnique({
                where: { email },
              });

              await EmailService.sendMagicLinkEmail({
                user: {
                  id: user?.id || "new-user",
                  email,
                  name: user?.name || undefined,
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

  // Hooks for user sync
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Sync user data after successful sign-in or sign-up
      const newSession = ctx.context.newSession;
      if (newSession?.user) {
        const { user } = newSession;
        
        try {
          // Sync BetterAuth user to app User table
          await syncUserToAppUser({
            betterAuthUserId: user.id,
            email: user.email,
            name: user.name || null,
            emailVerified: user.emailVerified || false,
            image: user.image || null,
          });

          // Update lastLoginAt
          await updateLastLoginAt(user.id);
        } catch (error) {
          // Log error but don't fail the auth flow
          console.error("Error syncing user data:", error);
        }
      }
    }),
  },
});

