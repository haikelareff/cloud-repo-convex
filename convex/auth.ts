import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireActionCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth/minimal";
import {
  anonymous,
  emailOTP,
  genericOAuth,
  magicLink,
  twoFactor,
  username,
} from "better-auth/plugins";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { internalAction, query } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";
import SendMagicLinkEmail from "./emails/send-magicLink-email";
import SendResetPasswordEmail from "./emails/send-reset-password-email";
import SendVerificationEmail from "./emails/send-verification-email";

const siteUrl = process.env.SITE_URL ?? "";

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
    //verbose: false,
  }
);

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    account: {
      accountLinking: {
        enabled: true,
        allowDifferentEmails: true,
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await SendVerificationEmail(requireActionCtx(ctx), {
          to: user.email,
          url,
        });
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      SendResetPasswordEmail: async ({ user, url }) => {
        await SendResetPasswordEmail(requireActionCtx(ctx), {
          to: user.email,
          url,
        });
      },
    },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        accessType: "offline",
        prompt: "select_account consent",
      },
    },
    user: {
      additionalFields: {
        foo: {
          type: "string",
          required: false,
        },
      },
      deleteUser: {
        enabled: true,
      },
    },
    plugins: [
      anonymous(),
      username(),
      magicLink({
        SendMagicLinkEmail: async ({ email, url }) => {
          await SendMagicLinkEmail(requireActionCtx(ctx), {
            to: email,
            url,
          });
        },
      }),
      emailOTP({
        async SendOTPVerificationEmail({ email, otp }) {
          await SendOTPVerificationEmail(requireActionCtx(ctx), {
            to: email,
            code: otp,
          });
        },
      }),
      twoFactor(),
      genericOAuth({
        config: [
          {
            providerId: "github",
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
            discoveryUrl: "https://github.com/.well-known/openid-configuration",
            scopes: ["openid", "email", "profile"],
          },
        ],
      }),
      convex({
        authConfig.convex,
      }),
    ],
  } satisfies BetterAuthOptions;
};

export const { getAuthUser } = authComponent.clientApi();

export const rotateKeys = internalAction({
  args: {},
  handler: async (ctx) => {
    const auth = createAuth(ctx);
    return await auth.api.rotateKeys();
  },
});

export const getCurrentUser = query({
  args: {},
  returns: v.any(),
  async handler(ctx, _args) {
    return await authComponent.getAuthUser(ctx);
  },
});

// Get a user by their Better Auth user id with Local Install
export const getUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await authComponent.getAnyUserById(ctx, args.userId);
  },
});
// Backward-compatible alias for callers using `getUserByID`
export const getUserByID = getUserById;
