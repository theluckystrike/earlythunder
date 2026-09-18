/**
 * Stripe webhook handler for Early Thunder.
 *
 * Verifies webhook signatures, processes subscription lifecycle events,
 * and stores payment status in KV. Uses the Web Crypto API available
 * in Cloudflare Workers (no Node.js crypto).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StripeEnv {
  readonly STRIPE_WEBHOOK_SECRET: string;
  readonly SUBSCRIBERS: KVNamespace;
}

interface StripeEvent {
  readonly id: string;
  readonly type: string;
  readonly data: {
    readonly object: Record<string, unknown>;
  };
}

interface PaymentRecord {
  readonly email: string;
  readonly status: string;
  readonly stripeEventId: string;
  readonly updatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KV_PAID_PREFIX = "paid:";
const MAX_WEBHOOK_BODY_SIZE = 65_536;
const SIGNATURE_TOLERANCE_SECONDS = 300;
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_INTERNAL = 500;

const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.deleted",
  "customer.subscription.updated",
]);

// ---------------------------------------------------------------------------
// Signature verification (Web Crypto — no Node.js)
// ---------------------------------------------------------------------------

/**
 * Converts a hex string to a Uint8Array.
 * Asserts even-length input and valid hex chars.
 */
function hexToBytes(hex: string): Uint8Array {
  if (typeof hex !== "string" || hex.length === 0 || hex.length % 2 !== 0) {
    throw new Error("hexToBytes: input must be a non-empty even-length hex string");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16);
    if (Number.isNaN(byte)) {
      throw new Error(`hexToBytes: invalid hex at position ${i}`);
    }
    bytes[i / 2] = byte;
  }
  return bytes;
}

/**
 * Converts a Uint8Array to a lowercase hex string.
 */
function bytesToHex(bytes: Uint8Array): string {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error("bytesToHex: input must be a Uint8Array");
  }

  const hexParts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    hexParts.push(bytes[i].toString(16).padStart(2, "0"));
  }
  return hexParts.join("");
}

/**
 * Computes HMAC-SHA256 using Web Crypto API.
 * Returns the hex-encoded signature string.
 */
async function computeHmacSha256(secret: string, payload: string): Promise<string> {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error("computeHmacSha256: secret must be a non-empty string");
  }
  if (typeof payload !== "string") {
    throw new Error("computeHmacSha256: payload must be a string");
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToHex(new Uint8Array(signatureBuffer));
}

/**
 * Constant-time comparison of two hex signature strings.
 * Prevents timing attacks on signature validation.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }

  const bytesA = hexToBytes(a);
  const bytesB = hexToBytes(b);

  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) {
    diff |= bytesA[i] ^ bytesB[i];
  }
  return diff === 0;
}

/**
 * Parses the Stripe-Signature header into timestamp and signatures.
 * Format: t=TIMESTAMP,v1=SIG1,v1=SIG2,...
 */
function parseSignatureHeader(header: string): { timestamp: number; signatures: string[] } {
  if (typeof header !== "string" || header.length === 0) {
    throw new Error("parseSignatureHeader: header must be a non-empty string");
  }

  let timestamp = -1;
  const signatures: string[] = [];

  const parts = header.split(",");
  for (let i = 0; i < parts.length; i++) {
    const [key, value] = parts[i].split("=", 2);
    if (key === "t") {
      timestamp = parseInt(value, 10);
    } else if (key === "v1") {
      signatures.push(value);
    }
  }

  if (timestamp < 0 || signatures.length === 0) {
    throw new Error("parseSignatureHeader: missing timestamp or v1 signature");
  }

  return { timestamp, signatures };
}

/**
 * Verifies a Stripe webhook signature against the raw body.
 * Checks both cryptographic validity and timestamp freshness.
 */
async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  if (typeof rawBody !== "string" || rawBody.length === 0) {
    return false;
  }

  const { timestamp, signatures } = parseSignatureHeader(signatureHeader);

  // Check timestamp freshness to prevent replay attacks
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    console.error(`verifyWebhookSignature: timestamp too old/future: ${timestamp} vs ${nowSeconds}`);
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = await computeHmacSha256(secret, signedPayload);

  for (let i = 0; i < signatures.length; i++) {
    if (timingSafeEqual(expectedSignature, signatures[i])) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/**
 * Extracts the customer email from a Stripe event object.
 * Different event types store the email in different locations.
 */
function extractEmail(event: StripeEvent): string | null {
  if (typeof event !== "object" || event === null) {
    return null;
  }

  const obj = event.data.object;

  // checkout.session.completed — email is at data.object.customer_email
  if (typeof obj.customer_email === "string" && obj.customer_email.length > 0) {
    return obj.customer_email.toLowerCase();
  }

  // subscription events — email may be nested in customer_details
  if (typeof obj.customer_details === "object" && obj.customer_details !== null) {
    const details = obj.customer_details as Record<string, unknown>;
    if (typeof details.email === "string" && details.email.length > 0) {
      return details.email.toLowerCase();
    }
  }

  // Fallback: some events store it at data.object.email
  if (typeof obj.email === "string" && obj.email.length > 0) {
    return obj.email.toLowerCase();
  }

  return null;
}

/**
 * Processes a checkout.session.completed event.
 * Marks the subscriber as "paid" in KV.
 */
async function handleCheckoutCompleted(
  event: StripeEvent,
  env: StripeEnv,
): Promise<void> {
  const email = extractEmail(event);
  if (email === null) {
    console.error(`handleCheckoutCompleted: no email in event ${event.id}`);
    return;
  }

  const record: PaymentRecord = {
    email,
    status: "paid",
    stripeEventId: event.id,
    updatedAt: new Date().toISOString(),
  };

  await env.SUBSCRIBERS.put(`${KV_PAID_PREFIX}${email}`, JSON.stringify(record));
  console.log(`handleCheckoutCompleted: marked ${email} as paid (event: ${event.id})`);
}

/**
 * Processes a customer.subscription.deleted event.
 * Marks the subscriber as "free" in KV.
 */
async function handleSubscriptionDeleted(
  event: StripeEvent,
  env: StripeEnv,
): Promise<void> {
  const email = extractEmail(event);
  if (email === null) {
    console.error(`handleSubscriptionDeleted: no email in event ${event.id}`);
    return;
  }

  const record: PaymentRecord = {
    email,
    status: "free",
    stripeEventId: event.id,
    updatedAt: new Date().toISOString(),
  };

  await env.SUBSCRIBERS.put(`${KV_PAID_PREFIX}${email}`, JSON.stringify(record));
  console.log(`handleSubscriptionDeleted: marked ${email} as free (event: ${event.id})`);
}

/**
 * Processes a customer.subscription.updated event.
 * Updates subscription status based on the new status field.
 */
async function handleSubscriptionUpdated(
  event: StripeEvent,
  env: StripeEnv,
): Promise<void> {
  const email = extractEmail(event);
  if (email === null) {
    console.error(`handleSubscriptionUpdated: no email in event ${event.id}`);
    return;
  }

  const obj = event.data.object;
  const stripeStatus = typeof obj.status === "string" ? obj.status : "unknown";
  const kvStatus = stripeStatus === "active" || stripeStatus === "trialing" ? "paid" : "free";

  const record: PaymentRecord = {
    email,
    status: kvStatus,
    stripeEventId: event.id,
    updatedAt: new Date().toISOString(),
  };

  await env.SUBSCRIBERS.put(`${KV_PAID_PREFIX}${email}`, JSON.stringify(record));
  console.log(`handleSubscriptionUpdated: ${email} -> ${kvStatus} (stripe: ${stripeStatus}, event: ${event.id})`);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

/** Build a JSON response with status and Content-Type header. */
function webhookJsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Validate the incoming request prerequisites (method, secret, signature header). */
function validateWebhookPrerequisites(
  request: Request,
  env: StripeEnv,
): { signatureHeader: string } | Response {
  if (request.method !== "POST") {
    return webhookJsonResponse({ error: "Method not allowed" }, 405);
  }
  if (typeof env.STRIPE_WEBHOOK_SECRET !== "string" || env.STRIPE_WEBHOOK_SECRET.length === 0) {
    console.error("handleStripeWebhook: STRIPE_WEBHOOK_SECRET is not configured");
    return webhookJsonResponse({ error: "Webhook not configured" }, HTTP_INTERNAL);
  }
  const signatureHeader = request.headers.get("Stripe-Signature");
  if (typeof signatureHeader !== "string" || signatureHeader.length === 0) {
    return webhookJsonResponse({ error: "Missing Stripe-Signature header" }, HTTP_UNAUTHORIZED);
  }
  return { signatureHeader };
}

/** Read the request body with size limit. Returns raw string or error Response. */
async function readWebhookBody(request: Request): Promise<string | Response> {
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_WEBHOOK_BODY_SIZE) {
      return webhookJsonResponse({ error: "Request body too large" }, HTTP_BAD_REQUEST);
    }
    if (rawBody.length === 0) {
      return webhookJsonResponse({ error: "Empty request body" }, HTTP_BAD_REQUEST);
    }
    return rawBody;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`handleStripeWebhook: body read failed: ${message}`);
    return webhookJsonResponse({ error: "Failed to read request body" }, HTTP_BAD_REQUEST);
  }
}

/** Verify signature and parse event body. Returns parsed event or error Response. */
async function verifyAndParseEvent(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<StripeEvent | Response> {
  let signatureValid: boolean;
  try {
    signatureValid = await verifyWebhookSignature(rawBody, signatureHeader, secret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`handleStripeWebhook: signature verification error: ${message}`);
    return webhookJsonResponse({ error: "Signature verification failed" }, HTTP_UNAUTHORIZED);
  }
  if (!signatureValid) {
    return webhookJsonResponse({ error: "Invalid signature" }, HTTP_UNAUTHORIZED);
  }

  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Event body is not an object");
    }
    const event = parsed as StripeEvent;
    if (typeof event.id !== "string" || typeof event.type !== "string") {
      return webhookJsonResponse({ error: "Malformed event: missing id or type" }, HTTP_BAD_REQUEST);
    }
    return event;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`handleStripeWebhook: JSON parse failed: ${message}`);
    return webhookJsonResponse({ error: "Invalid JSON body" }, HTTP_BAD_REQUEST);
  }
}

/** Dispatch a verified Stripe event to the appropriate handler. */
async function dispatchStripeEvent(event: StripeEvent, env: StripeEnv): Promise<Response> {
  console.log(`stripe-webhook: received event ${event.type} (${event.id})`);

  if (!HANDLED_EVENTS.has(event.type)) {
    return webhookJsonResponse({ received: true }, HTTP_OK);
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event, env);
    } else if (event.type === "customer.subscription.deleted") {
      await handleSubscriptionDeleted(event, env);
    } else if (event.type === "customer.subscription.updated") {
      await handleSubscriptionUpdated(event, env);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`handleStripeWebhook: handler error for ${event.type}: ${message}`);
    return webhookJsonResponse({ error: "Webhook processing failed" }, HTTP_INTERNAL);
  }

  return webhookJsonResponse({ received: true }, HTTP_OK);
}

/**
 * Handles an incoming Stripe webhook request.
 * Verifies the signature, parses the event, and dispatches to the
 * appropriate handler. Returns a plain Response.
 */
export async function handleStripeWebhook(
  request: Request,
  env: StripeEnv,
): Promise<Response> {
  const prereqs = validateWebhookPrerequisites(request, env);
  if (prereqs instanceof Response) return prereqs;

  const bodyResult = await readWebhookBody(request);
  if (bodyResult instanceof Response) return bodyResult;

  const eventResult = await verifyAndParseEvent(bodyResult, prereqs.signatureHeader, env.STRIPE_WEBHOOK_SECRET);
  if (eventResult instanceof Response) return eventResult;

  return dispatchStripeEvent(eventResult, env);
}
