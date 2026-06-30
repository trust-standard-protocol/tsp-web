// Vendored verbatim from @trust-standard-protocol/protocol (canonical.ts).
// Deterministic canonical JSON (sorted keys) — the JCS-style serialization the
// hashes and signature are computed over. Do not "improve" this: changing a
// single byte of output breaks compatibility with every shipped TSP verifier.
const REQUIRES_ESCAPE = /[\x00-\x1f"\\]/g;

const ESCAPE_MAP: Record<string, string> = {
  "\b": "\\b",
  "\t": "\\t",
  "\n": "\\n",
  "\f": "\\f",
  "\r": "\\r",
  '"': '\\"',
  "\\": "\\\\"
};

function escapeChar(value: string): string {
  if (value in ESCAPE_MAP) return ESCAPE_MAP[value];
  const code = value.charCodeAt(0);
  return "\\u" + code.toString(16).padStart(4, "0");
}

function canonicalString(value: string): string {
  return '"' + value.replace(REQUIRES_ESCAPE, escapeChar) + '"';
}

function canonicalNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error(`canonicalize: non-finite number not allowed: ${value}`);
  }
  if (Object.is(value, -0)) return "0";
  return JSON.stringify(value);
}

export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return canonicalNumber(value);
  if (typeof value === "string") return canonicalString(value);
  if (Array.isArray(value)) {
    return "[" + value.map((entry) => canonicalize(entry)).join(",") + "]";
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      "{" +
      Object.keys(record)
        .sort()
        .map((key) => canonicalString(key) + ":" + canonicalize(record[key]))
        .join(",") +
      "}"
    );
  }
  throw new Error(`canonicalize: unsupported value type: ${typeof value}`);
}
