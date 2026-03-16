import { createAuthOptions } from "../auth";

// Export a static instance for Better Auth schema generation
// biome-ignore lint/suspicious/noExplicitAny: ok
export const auth = createAuthOptions({} as any);
