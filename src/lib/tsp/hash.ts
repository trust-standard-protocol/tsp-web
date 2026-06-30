// Vendored verbatim from @trust-standard-protocol/protocol (hash.ts).
// SHA-256 over UTF-8 bytes via WebCrypto (available in every modern browser).
const encoder = new TextEncoder();

export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data = typeof input === "string" ? encoder.encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
