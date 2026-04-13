/**
 * Early Thunder API — Cloudflare Worker
 *
 * Routes:
 *   POST /api/subscribe  — Email capture with rate limiting
 *   GET  /api/health     — Health check
 *   OPTIONS *             — CORS preflight
 */

import { isValidEmail, isRateLimited } from "./validate";
import { sendWelcomeEmail } from "./email";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Env {
  readonly RESEND_API_KEY: string;
  readonly ALLOWED_ORIGIN: string;
  readonly SUBSCRIBERS: KVNamespace;
}

interface SubscribeRequest {
  readonly email: string;
}

interface SuccessResponse {
  readonly success: true;
}

interface ErrorResponse {
  readonly error: string;
}

interface HealthResponse {
  readonly status: "ok";
  readonly timestamp: string;
}

type ApiResponse = SuccessResponse | ErrorResponse | HealthResponse;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTENT_TYPE_JSON = "application/json";
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_TOO_MANY = 429;
const HTTP_METHOD_NOT_ALLOWED = 405;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL = 500;
const HTTP_NO_CONTENT = 204;
const MAX_BODY_SIZE = 1024;
const KV_SUBSCRIBER_PREFIX = "sub:";

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

function corsHeaders(origin: string, allowedOrigin: string): Record<string, string> {
  const effectiveOrigin = origin === allowedOrigin ? allowedOrigin : allowedOrigin;
  return {
    "Access-Control-Allow-Origin": effectiveOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(
  body: ApiResponse,
  status: number,
  origin: string,
  allowedOrigin: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": CONTENT_TYPE_JSON,
      ...corsHeaders(origin, allowedOrigin),
    },
  });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * Parses and validates the subscribe request body.
 * Returns the email string on success, or an error string on failure.
 */
async function parseSubscribeBody(
  request: Request,
): Promise<{ email: string } | { error: string }> {
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_SIZE) {
      return { error: "Request body too large" };
    }
    body = JSON.parse(raw);
  } catch {
    return { error: "Invalid JSON body" };
  }

  if (typeof body !== "object" || body === null || !("email" in body)) {
    return { error: "Missing email field" };
  }

  const { email } = body as SubscribeRequest;

  if (!isValidEmail(email)) {
    return { error: "Invalid email address" };
  }

  return { email };
}

/**
 * Stores a new subscriber and sends the welcome email.
 */
async function storeAndWelcome(
  email: string,
  clientIp: string,
  env: Env,
): Promise<boolean> {
  const subscriberKey = `${KV_SUBSCRIBER_PREFIX}${email.toLowerCase()}`;
  const existingRecord = await env.SUBSCRIBERS.get(subscriberKey);

  if (existingRecord !== null) {
    return true; // Already subscribed
  }

  const record = JSON.stringify({
    email: email.toLowerCase(),
    subscribedAt: new Date().toISOString(),
    ip: clientIp,
  });
  await env.SUBSCRIBERS.put(subscriberKey, record);

  const emailSent = await sendWelcomeEmail(email, env);
  if (!emailSent) {
    console.error(`storeAndWelcome: welcome email failed for ${email}`);
  }

  return true;
}

async function handleSubscribe(
  request: Request,
  env: Env,
): Promise<Response> {
  const origin = request.headers.get("Origin") ?? "";

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, HTTP_METHOD_NOT_ALLOWED, origin, env.ALLOWED_ORIGIN);
  }

  const clientIp = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const limited = await isRateLimited(clientIp, env.SUBSCRIBERS);
  if (limited) {
    return jsonResponse({ error: "Too many requests. Try again later." }, HTTP_TOO_MANY, origin, env.ALLOWED_ORIGIN);
  }

  const parsed = await parseSubscribeBody(request);
  if ("error" in parsed) {
    return jsonResponse({ error: parsed.error }, HTTP_BAD_REQUEST, origin, env.ALLOWED_ORIGIN);
  }

  await storeAndWelcome(parsed.email, clientIp, env);
  return jsonResponse({ success: true }, HTTP_OK, origin, env.ALLOWED_ORIGIN);
}

function handleHealth(request: Request, env: Env): Response {
  const origin = request.headers.get("Origin") ?? "";
  const body: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
  return jsonResponse(body, HTTP_OK, origin, env.ALLOWED_ORIGIN);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function handlePreflight(request: Request, env: Env): Response {
  const origin = request.headers.get("Origin") ?? "";
  return new Response(null, {
    status: HTTP_NO_CONTENT,
    headers: corsHeaders(origin, env.ALLOWED_ORIGIN),
  });
}

async function router(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const origin = request.headers.get("Origin") ?? "";

  // CORS preflight for any route
  if (request.method === "OPTIONS") {
    return handlePreflight(request, env);
  }

  if (pathname === "/api/subscribe") {
    return handleSubscribe(request, env);
  }

  if (pathname === "/api/health") {
    return handleHealth(request, env);
  }

  return jsonResponse({ error: "Not found" }, HTTP_NOT_FOUND, origin, env.ALLOWED_ORIGIN);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await router(request, env);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error(`Unhandled error: ${message}`);
      const origin = request.headers.get("Origin") ?? "";
      return jsonResponse(
        { error: "Internal server error" },
        HTTP_INTERNAL,
        origin,
        env.ALLOWED_ORIGIN,
      );
    }
  },
};
