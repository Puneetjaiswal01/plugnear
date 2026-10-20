const pattern = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;
export function androidAssetLinks(config, extra = "") {
  if (config.packageId !== "in.plugnear.mobile")
    throw new Error("Unexpected Android package.");
  const values = [
    ...(config.fingerprints || []).map((item) => item.value),
    ...extra.split(",").filter((item) => item.trim()),
  ];
  const fingerprints = [
    ...new Set(values.map((value) => String(value).trim().toUpperCase())),
  ];
  if (fingerprints.some((value) => !pattern.test(value)))
    throw new Error(
      "Expected a complete SHA-256 certificate fingerprint, colon-separated.",
    );
  // No certificate is trusted until the actual signing certificate is provided.
  if (!fingerprints.length) return [];
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: config.packageId,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];
}
