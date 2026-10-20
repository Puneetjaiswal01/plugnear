import { test } from "node:test";
import assert from "node:assert/strict";
import { androidAssetLinks } from "./assetlinks.mjs";
const packageId = "in.plugnear.mobile";
const certificate = Array(32).fill("AB").join(":");
test("no configured certificate creates no trusted Android association", () => {
  assert.deepEqual(androidAssetLinks({ packageId, fingerprints: [] }), []);
});
test("Play app-signing fingerprint is validated, normalized and deduplicated", () => {
  const result = androidAssetLinks(
    { packageId, fingerprints: [{ value: certificate.toLowerCase() }] },
    certificate,
  );
  assert.equal(result[0].target.package_name, packageId);
  assert.deepEqual(result[0].target.sha256_cert_fingerprints, [certificate]);
});
test("malformed fingerprints or a different package cannot be published", () => {
  assert.throws(() => androidAssetLinks({ packageId }, "PLACEHOLDER"));
  assert.throws(() => androidAssetLinks({ packageId }, "ab:cd"));
  assert.throws(() =>
    androidAssetLinks({ packageId: "other.app" }, certificate),
  );
});
