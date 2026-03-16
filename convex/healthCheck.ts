import { query } from "./_generated/server";
import { createAuthOptions } from "./auth";

export const getSessionHealth = query({
  handler: async (ctx) => {
    const { authComponent, headers } = await authComponent.getAuth(
      ctx,
      createAuthOptions
    );
    const data = await authComponent.clientApi().getSession;
    ({
      headers,
    });
    return data;
  },
});
