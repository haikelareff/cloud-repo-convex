import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return {
        message: "Not authenticated",
        user: null,
      };
    }
    return {
      message: "This is private",
      user: identity,
    };
  },
});

export const verifyApiKey = mutation({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const { auth } = await authComponent.getAuth(ctx);
    const data = await auth.verifyApiKey({
      body: {
        key: args.apiKey,
      },
    });
    return data;
  },
});
