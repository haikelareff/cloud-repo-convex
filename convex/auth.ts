import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireActionCtx } from "@convex-dev/better-auth/utils";
import { betterAuth } from "better-auth";
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
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { internalAction, query } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";

const siteUrl = process.env.SITE_URL ?? "";

type EmailPayload = { to: string; subject: string; text: string };

const sendAuthEmail = async (
  ctx: any,
  payload: EmailPayload,
) => {
  await ctx.runAction(internal.auth.sendEmailNotification, payload);
};

const sendVerificationEmail = async (
  ctx: any,
  args: { to: string; url: string },
) => {
  await sendAuthEmail(ctx, {
    to: args.to,
    subject: "Verify your email",
    text: `Welcome! Please verify your email by visiting: ${args.url}`,
  });
};

const sendResetPassword = async (
  ctx: any,
  args: { to: string; url: string },
) => {
  await sendAuthEmail(ctx, {
    to: args.to,
    subject: "Reset your password",
    text: `Reset your password using this link: ${args.url}`,
  });
};

const sendMagicLink = async (
  ctx: any,
  args: { to: string; url: string },
) => {
  await sendAuthEmail(ctx, {
    to: args.to,
    subject: "Your magic sign-in link",
    text: `Use this magic link to sign in: ${args.url}`,
  });
};

const sendOTPVerification = async (
  ctx: any,
  args: { to: string; code: string },
) => {
  await sendAuthEmail(ctx, {
    to: args.to,
    subject: "Your verification code",
    text: `Your one-time verification code is: ${args.code}`,
  });
};

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
  },
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
        await sendVerificationEmail(requireActionCtx(ctx), {
          to: user.email,
          url,
        });
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendResetPassword(requireActionCtx(ctx), {
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
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLink(requireActionCtx(ctx), {
            to: email,
            url,
          });
        },
      }),
      emailOTP({
        async sendVerificationOTP({ email, otp }) {
          await sendOTPVerification(requireActionCtx(ctx), {
            to: email,
            code: otp,
          });
        },
      }),
      twoFactor(),
      genericOAuth({
        config: [
          {
            providerId: "slack",
            clientId: process.env.SLACK_CLIENT_ID as string,
            clientSecret: process.env.SLACK_CLIENT_SECRET as string,
            discoveryUrl: "https://slack.com/.well-known/openid-configuration",
            scopes: ["openid", "email", "profile"],
          },
        ],
      }),
      convex({
        authConfig,
      }),
    ],
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth(createAuthOptions(ctx));

export const { getAuthUser } = authComponent.clientApi();

export const sendEmailNotification = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    text: v.string(),
  },
  handler: async (_ctx, args) => {
    // Integrate your email provider/component here (Resend, SES, Sendgrid, etc.).
    // This keeps Better Auth delivery logic in Convex and makes the handoff explicit.
    console.log("[auth email]", args);
  },
});

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
