import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

export function createAuth(db, client) {
  if (!db || typeof db.collection !== "function") {
    throw new Error("A connected MongoDB database is required to initialize Better Auth.");
  }
  if (!client || typeof client.startSession !== "function") {
    throw new Error("The shared MongoDB client is required to initialize Better Auth.");
  }

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 bytes before starting the API.");
  }

  const baseURL = process.env.BETTER_AUTH_URL;
  if (!baseURL) {
    throw new Error("BETTER_AUTH_URL must be configured before starting the API.");
  }
  let parsedBaseURL;
  try { parsedBaseURL = new URL(baseURL); }
  catch { throw new Error("BETTER_AUTH_URL must be a valid absolute URL."); }
  if (!["http:", "https:"].includes(parsedBaseURL.protocol) || parsedBaseURL.username || parsedBaseURL.password || parsedBaseURL.pathname !== "/" || parsedBaseURL.search || parsedBaseURL.hash) {
    throw new Error("BETTER_AUTH_URL must be an HTTP(S) origin without credentials, a path, or query parameters.");
  }
  if (process.env.NODE_ENV === "production" && parsedBaseURL.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL must use HTTPS in production.");
  }
  const cookieSameSite = String(process.env.BETTER_AUTH_COOKIE_SAME_SITE || "lax").toLowerCase();
  if (!["lax", "none"].includes(cookieSameSite)) {
    throw new Error("BETTER_AUTH_COOKIE_SAME_SITE must be either lax or none.");
  }
  if (cookieSameSite === "none" && parsedBaseURL.protocol !== "https:") {
    throw new Error("SameSite=None auth cookies require an HTTPS BETTER_AUTH_URL.");
  }

  const trustedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  for (const origin of trustedOrigins) {
    let parsedOrigin;
    try { parsedOrigin = new URL(origin); }
    catch { throw new Error("FRONTEND_ORIGINS must contain valid absolute origins."); }
    if (!["http:", "https:"].includes(parsedOrigin.protocol) || parsedOrigin.origin !== origin) {
      throw new Error("FRONTEND_ORIGINS entries must be exact HTTP(S) origins without paths or credentials.");
    }
    if (process.env.NODE_ENV === "production" && parsedOrigin.protocol !== "https:") {
      throw new Error("FRONTEND_ORIGINS must use HTTPS in production.");
    }
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const hasGoogleCredentials = googleClientId && googleClientSecret;

  const config = {
    database: mongodbAdapter(db, { client }),
    secret,
    baseURL,
    trustedOrigins,
    advanced: {
      defaultCookieAttributes: {
        sameSite: cookieSameSite,
        ...(cookieSameSite === "none" ? { secure: true } : {}),
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        phone: { type: "string", required: false, input: true },
        district: { type: "string", required: false, input: true },
        area: { type: "string", required: false, input: true },
        address: { type: "string", required: false, input: true },
        role: { type: "string", required: false, defaultValue: "customer", input: false },
      },
    },
  };

  if (hasGoogleCredentials) {
    config.socialProviders = {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      },
    };
    config.accountLinking = {
      enabled: true,
    };
  } else if (process.env.NODE_ENV !== "test") {
    console.warn("Google OAuth credentials not configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET). Google sign-in will be unavailable. Email/password authentication remains active.");
  }

  return betterAuth(config);
}
