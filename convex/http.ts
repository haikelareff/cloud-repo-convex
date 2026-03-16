import { httpRouter } from "convex/server";
import { authComponent, createAuthOptions } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuthOptions);

export default http;
