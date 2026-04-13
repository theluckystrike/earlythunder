/**
 * JSON-LD structured data component.
 * Renders a <script type="application/ld+json"> tag in the document head.
 *
 * Usage:
 *   <JsonLd data={getOrganizationSchema()} />
 */

interface JsonLdProps {
  /** The structured data object to serialize as JSON-LD. */
  readonly data: Record<string, unknown>;
}

const MAX_JSON_LENGTH = 100_000;

export default function JsonLd({ data }: JsonLdProps) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const jsonString = JSON.stringify(data);

  if (jsonString.length > MAX_JSON_LENGTH) {
    console.warn("JSON-LD data exceeds maximum length; skipping render.");
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}
