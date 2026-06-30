// Vendored verbatim from @trust-standard-protocol/protocol (schema.ts).
// Structural validation of a TrustEnvelope V3 (strict: unknown keys rejected).
import { TSP_V3_VERSION } from "./types";

const sha256Pattern = /^[a-f0-9]{64}$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const sourceTypes = new Set([
  "legal-database",
  "government-website",
  "official-document",
  "academic-paper",
  "verified-website",
  "model-knowledge",
  "user-input",
  "unknown"
]);
const contentTypes = new Set(["text", "document", "structured"]);
const severities = new Set(["low", "med", "high"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

function hasOnly(value: Record<string, unknown>, path: string, allowed: string[], errors: string[]): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) errors.push(`${path}.${key} is not allowed`);
  }
}

function recordAt(parent: Record<string, unknown>, key: string, path: string, errors: string[]): Record<string, unknown> | undefined {
  const value = parent[key];
  if (!isRecord(value)) {
    errors.push(`${path}.${key} must be an object`);
    return undefined;
  }
  return value;
}

function arrayAt(parent: Record<string, unknown>, key: string, path: string, errors: string[]): unknown[] | undefined {
  const value = parent[key];
  if (!Array.isArray(value)) {
    errors.push(`${path}.${key} must be an array`);
    return undefined;
  }
  return value;
}

function stringAt(parent: Record<string, unknown>, key: string, path: string, errors: string[]): string | undefined {
  const value = parent[key];
  if (!isString(value)) {
    errors.push(`${path}.${key} must be a string`);
    return undefined;
  }
  return value;
}

function optionalStringAt(parent: Record<string, unknown>, key: string, path: string, errors: string[]): void {
  if (parent[key] !== undefined && !isString(parent[key])) errors.push(`${path}.${key} must be a string`);
}

function booleanAt(parent: Record<string, unknown>, key: string, path: string, errors: string[]): void {
  if (typeof parent[key] !== "boolean") errors.push(`${path}.${key} must be a boolean`);
}

function numberAt(parent: Record<string, unknown>, key: string, path: string, errors: string[]): void {
  if (typeof parent[key] !== "number" || !Number.isFinite(parent[key])) {
    errors.push(`${path}.${key} must be a finite number`);
  }
}

function integerAt(parent: Record<string, unknown>, key: string, path: string, errors: string[]): void {
  if (!Number.isInteger(parent[key])) errors.push(`${path}.${key} must be an integer`);
}

function sha256At(parent: Record<string, unknown>, key: string, path: string, errors: string[]): void {
  const value = stringAt(parent, key, path, errors);
  if (value !== undefined && !sha256Pattern.test(value)) {
    errors.push(`${path}.${key} must be a lowercase sha256 hex string`);
  }
}

function dateTimeAt(parent: Record<string, unknown>, key: string, path: string, errors: string[]): void {
  const value = stringAt(parent, key, path, errors);
  if (value !== undefined && (!dateTimePattern.test(value) || Number.isNaN(Date.parse(value)))) {
    errors.push(`${path}.${key} must be an ISO-8601 date-time string`);
  }
}

function uriAt(parent: Record<string, unknown>, key: string, path: string, errors: string[]): void {
  const value = stringAt(parent, key, path, errors);
  if (value === undefined) return;
  try {
    new URL(value);
  } catch {
    errors.push(`${path}.${key} must be a URI`);
  }
}

export function validateTrustEnvelopeV3Shape(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["envelope must be an object"];

  hasOnly(value, "envelope", [
    "tsp",
    "content",
    "declaration",
    "process",
    "alignment",
    "timestamp",
    "ledger",
    "signatures",
    "executionProvenance"
  ], errors);

  const tsp = stringAt(value, "tsp", "envelope", errors);
  if (tsp !== undefined && tsp !== TSP_V3_VERSION) {
    errors.push(`envelope.tsp must be "${TSP_V3_VERSION}"`);
  }

  validateContent(recordAt(value, "content", "envelope", errors), errors);
  validateDeclaration(recordAt(value, "declaration", "envelope", errors), errors);
  validateProcess(recordAt(value, "process", "envelope", errors), errors);
  validateAlignment(recordAt(value, "alignment", "envelope", errors), errors);
  validateTimestamp(recordAt(value, "timestamp", "envelope", errors), errors);
  validateLedger(recordAt(value, "ledger", "envelope", errors), errors);

  const signatures = arrayAt(value, "signatures", "envelope", errors);
  if (signatures !== undefined) {
    if (signatures.length === 0) errors.push("envelope.signatures must contain at least one entry");
    signatures.forEach((entry, index) => validateSignature(entry, `envelope.signatures[${index}]`, errors));
  }

  return errors;
}

function validateContent(value: Record<string, unknown> | undefined, errors: string[]): void {
  if (!value) return;
  hasOnly(value, "content", ["type", "value", "hash"], errors);
  const type = stringAt(value, "type", "content", errors);
  if (type !== undefined && !contentTypes.has(type)) errors.push("content.type must be text, document, or structured");
  if (value.value === undefined) errors.push("content.value is required");
  sha256At(value, "hash", "content", errors);
}

function validateDeclaration(value: Record<string, unknown> | undefined, errors: string[]): void {
  if (!value) return;
  hasOnly(value, "declaration", ["primarySource", "citations"], errors);
  const primarySource = recordAt(value, "primarySource", "declaration", errors);
  if (primarySource) {
    hasOnly(primarySource, "declaration.primarySource", ["type", "url", "title", "retrieved"], errors);
    const type = stringAt(primarySource, "type", "declaration.primarySource", errors);
    if (type !== undefined && !sourceTypes.has(type)) errors.push("declaration.primarySource.type is not a v3 source type");
    optionalStringAt(primarySource, "url", "declaration.primarySource", errors);
    stringAt(primarySource, "title", "declaration.primarySource", errors);
    if (primarySource.retrieved !== undefined) dateTimeAt(primarySource, "retrieved", "declaration.primarySource", errors);
  }

  arrayAt(value, "citations", "declaration", errors)?.forEach((entry, index) => {
    const path = `declaration.citations[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${path} must be an object`);
      return;
    }
    hasOnly(entry, path, ["url", "paragraph", "quote", "retrieved"], errors);
    stringAt(entry, "url", path, errors);
    stringAt(entry, "paragraph", path, errors);
    stringAt(entry, "quote", path, errors);
    dateTimeAt(entry, "retrieved", path, errors);
  });
}

function validateProcess(value: Record<string, unknown> | undefined, errors: string[]): void {
  if (!value) return;
  hasOnly(value, "process", ["model", "systemPrompt", "pipeline"], errors);
  const model = recordAt(value, "model", "process", errors);
  if (model) {
    hasOnly(model, "process.model", ["provider", "name", "version", "temperature", "contextWindow"], errors);
    stringAt(model, "provider", "process.model", errors);
    stringAt(model, "name", "process.model", errors);
    stringAt(model, "version", "process.model", errors);
    numberAt(model, "temperature", "process.model", errors);
    integerAt(model, "contextWindow", "process.model", errors);
  }

  const systemPrompt = recordAt(value, "systemPrompt", "process", errors);
  if (systemPrompt) {
    if ("text" in systemPrompt) {
      hasOnly(systemPrompt, "process.systemPrompt", ["hash", "text"], errors);
      sha256At(systemPrompt, "hash", "process.systemPrompt", errors);
      stringAt(systemPrompt, "text", "process.systemPrompt", errors);
    } else {
      hasOnly(systemPrompt, "process.systemPrompt", ["hash", "redacted", "reason"], errors);
      sha256At(systemPrompt, "hash", "process.systemPrompt", errors);
      if (systemPrompt.redacted !== true) errors.push("process.systemPrompt.redacted must be true");
      stringAt(systemPrompt, "reason", "process.systemPrompt", errors);
    }
  }

  if (value.pipeline !== undefined) {
    arrayAt(value, "pipeline", "process", errors)?.forEach((entry, index) => {
      const path = `process.pipeline[${index}]`;
      if (!isRecord(entry)) {
        errors.push(`${path} must be an object`);
        return;
      }
      hasOnly(entry, path, ["name", "durationMs", "meta"], errors);
      stringAt(entry, "name", path, errors);
      if (entry.durationMs !== undefined) numberAt(entry, "durationMs", path, errors);
      if (entry.meta !== undefined && !isRecord(entry.meta)) errors.push(`${path}.meta must be an object`);
    });
  }
}

function validateAlignment(value: Record<string, unknown> | undefined, errors: string[]): void {
  if (!value) return;
  hasOnly(value, "alignment", ["uncertainty", "flags", "humanReviewRequired", "policy", "refusal"], errors);
  arrayAt(value, "uncertainty", "alignment", errors)?.forEach((entry, index) => {
    const path = `alignment.uncertainty[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${path} must be an object`);
      return;
    }
    hasOnly(entry, path, ["field", "reason", "severity"], errors);
    stringAt(entry, "field", path, errors);
    stringAt(entry, "reason", path, errors);
    const severity = stringAt(entry, "severity", path, errors);
    if (severity !== undefined && !severities.has(severity)) errors.push(`${path}.severity must be low, med, or high`);
  });
  booleanAt(value, "humanReviewRequired", "alignment", errors);
  const policy = recordAt(value, "policy", "alignment", errors);
  if (policy) {
    hasOnly(policy, "alignment.policy", ["id", "version"], errors);
    stringAt(policy, "id", "alignment.policy", errors);
    stringAt(policy, "version", "alignment.policy", errors);
  }
  if (value.flags !== undefined) {
    arrayAt(value, "flags", "alignment", errors)?.forEach((entry, index) => {
      const path = `alignment.flags[${index}]`;
      if (!isRecord(entry)) {
        errors.push(`${path} must be an object`);
        return;
      }
      hasOnly(entry, path, ["code", "detail"], errors);
      stringAt(entry, "code", path, errors);
      optionalStringAt(entry, "detail", path, errors);
    });
  }
  if (value.refusal !== undefined) {
    const refusal = recordAt(value, "refusal", "alignment", errors);
    if (refusal) {
      hasOnly(refusal, "alignment.refusal", ["reason"], errors);
      stringAt(refusal, "reason", "alignment.refusal", errors);
    }
  }
}

function validateTimestamp(value: Record<string, unknown> | undefined, errors: string[]): void {
  if (!value) return;
  hasOnly(value, "timestamp", ["claimed", "tsaToken", "tsaUrl"], errors);
  dateTimeAt(value, "claimed", "timestamp", errors);
  stringAt(value, "tsaToken", "timestamp", errors);
  uriAt(value, "tsaUrl", "timestamp", errors);
}

function validateLedger(value: Record<string, unknown> | undefined, errors: string[]): void {
  if (!value) return;
  hasOnly(value, "ledger", ["id", "prevHash", "hash"], errors);
  stringAt(value, "id", "ledger", errors);
  sha256At(value, "prevHash", "ledger", errors);
  sha256At(value, "hash", "ledger", errors);
}

function validateSignature(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  hasOnly(value, path, ["role", "algorithm", "keyRef", "signature", "certChain"], errors);
  const role = stringAt(value, "role", path, errors);
  if (role !== undefined && role !== "instance" && role !== "human-reviewer") {
    errors.push(`${path}.role must be instance or human-reviewer`);
  }
  const algorithm = stringAt(value, "algorithm", path, errors);
  if (algorithm !== undefined && algorithm !== "ed25519") errors.push(`${path}.algorithm must be ed25519`);
  uriAt(value, "keyRef", path, errors);
  stringAt(value, "signature", path, errors);
  arrayAt(value, "certChain", path, errors)?.forEach((entry, index) => {
    if (!isString(entry)) errors.push(`${path}.certChain[${index}] must be a string`);
  });
}
