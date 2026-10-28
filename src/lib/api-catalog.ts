/**
 * Reads the published OpenAPI document so the API pricing page cannot drift from
 * the contract the API actually serves.
 *
 * The prices here are `advisoryPriceUsd` from `x-payment-info`. They are the same
 * numbers the free catalog endpoint returns, and the live HTTP 402 challenge is
 * the authoritative price for any single request.
 */
import openapi from "../../public/openapi.json";

interface PaymentOffer {
  readonly advisoryPriceUsd: number;
}

interface Operation {
  readonly summary: string;
  readonly "x-payment-info"?: { readonly offers: readonly PaymentOffer[] };
}

const DOC = openapi as unknown as {
  readonly paths: Record<string, { readonly get: Operation }>;
};

export interface PaidEndpoint {
  /** Path as published, e.g. /api/x402/v1/scores. */
  readonly path: string;
  /** One-line description of the payload. */
  readonly summary: string;
  /** Price in US dollars. */
  readonly priceUsd: number;
  /** Price formatted for display, e.g. $0.25. */
  readonly price: string;
}

/** Formats a dollar price with two decimals. */
export function formatUsdPrice(value: number): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("formatUsdPrice needs a finite, non-negative number.");
  }
  return `$${value.toFixed(2)}`;
}

/** Every endpoint that carries a payment offer, in document order. */
export function getPaidEndpoints(): PaidEndpoint[] {
  return Object.entries(DOC.paths)
    .flatMap(([path, operation]) => {
      const offers = operation.get["x-payment-info"]?.offers ?? [];
      if (offers.length === 0) return [];
      const priceUsd = offers[0].advisoryPriceUsd;
      return [
        {
          path,
          summary: operation.get.summary,
          priceUsd,
          price: formatUsdPrice(priceUsd),
        },
      ];
    });
}
