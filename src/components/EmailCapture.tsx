const DISCORD_URL = "https://discord.gg/QeHxTFbqmC";

/** Discord invite button. Replaces the former email capture form. */
export default function EmailCapture() {
  console.assert(typeof DISCORD_URL === "string", "EmailCapture: DISCORD_URL required");
  console.assert(DISCORD_URL.startsWith("https://"), "EmailCapture: must be https");

  return (
    <div className="text-center">
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-bolt inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium"
      >
        Join Discord &rarr;
      </a>
    </div>
  );
}
