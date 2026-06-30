// Regression proof that the vendored verify library is faithful to the protocol.
// Runs the vendored verifyTrustEnvelopeV3 against the protocol's own v3 fixture
// cases and asserts the upstream-expected status/checks, then proves the demo
// signer's output round-trips (intact -> valid; one tampered byte -> invalid).
// Run with Node 24 (native TS type-stripping): `node scripts/verify-selftest.mjs`.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  verifyTrustEnvelopeV3,
  generateDemoSigner,
  sealEnvelope
} from "../src/lib/tsp/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(here, "..", "src", "lib", "tsp", "fixtures", "v3");

async function readJson(name) {
  return JSON.parse(await readFile(join(fixtureDir, name), "utf8"));
}

let failures = 0;
function check(name, condition, detail) {
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}`);
  if (!condition) {
    failures += 1;
    if (detail !== undefined) console.log("      ", JSON.stringify(detail));
  }
}

const cases = await readJson("cases.json");
const publicKey = await readJson(cases.publicKeyPath);

for (const testCase of cases.cases) {
  const envelope = await readJson(testCase.envelopePath);
  const result = await verifyTrustEnvelopeV3(envelope, { publicKey });
  const expected = testCase.expected;
  const matches =
    result.status === expected.status &&
    result.valid === expected.valid &&
    result.checks.schema.status === expected.schema &&
    result.checks.contentHash.status === expected.contentHash &&
    result.checks.ledgerHash.status === expected.ledgerHash &&
    result.checks.signature.status === expected.signature;
  check(`fixture ${testCase.id} -> status=${result.status} valid=${result.valid}`, matches, {
    expected,
    got: { status: result.status, valid: result.valid, checks: result.checks }
  });
}

// Demo signer round-trip: seal -> real verify says valid.
const validEnvelope = await readJson("valid-envelope.json");
const signer = await generateDemoSigner("selftest-001");
const draft = structuredClone(validEnvelope);
draft.content.value = "Round-trip self-test payload.";
const sealed = await sealEnvelope(draft, signer);
const sealedResult = await verifyTrustEnvelopeV3(sealed, { publicKey: signer.publicKey });
check(`demo-seal round-trips -> valid=${sealedResult.valid}`, sealedResult.valid === true, sealedResult.checks);

// Tamper exactly one byte of the signed content -> real verify must fail.
const tampered = structuredClone(sealed);
tampered.content.value = `${tampered.content.value}!`;
const tamperedResult = await verifyTrustEnvelopeV3(tampered, { publicKey: signer.publicKey });
check(
  `demo-seal tamper fails -> valid=${tamperedResult.valid} content=${tamperedResult.checks.contentHash.status}`,
  tamperedResult.valid === false && tamperedResult.checks.contentHash.status === "failed",
  tamperedResult.checks
);

if (failures > 0) {
  console.error(`\nverify-selftest: ${failures} failure(s).`);
  process.exit(1);
}
console.log("\nverify-selftest passed: vendored TSP verify matches upstream fixtures; demo signer round-trips and tamper fails.");
