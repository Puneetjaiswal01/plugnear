import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { TwaManifest, TwaGenerator, ConsoleLog } = require("@bubblewrap/core");
const { fetchUtils } = require("@bubblewrap/core/dist/lib/FetchUtils.js");
const root = new URL("../../", import.meta.url);
const project = new URL("android/twa/", root);
const config = JSON.parse(
  await readFile(new URL("twa-manifest.json", project), "utf8"),
);
if (
  config.host !== "app.plugnear.in" ||
  config.startUrl !== "/app/" ||
  config.packageId !== "in.plugnear.mobile"
) {
  throw new Error(
    "Refusing to generate an Android wrapper for a different project.",
  );
}
// Generate reproducibly from the same approved assets as the web build, without
// fetching or trusting remote icon/config content during code generation.
const assets = new Map([
  [
    config.iconUrl,
    {
      path: new URL("apps/website/dist/app/icons/icon-512.png", root),
      type: "image/png",
    },
  ],
  [
    config.webManifestUrl,
    {
      path: new URL("apps/website/dist/app/manifest.webmanifest", root),
      type: "application/manifest+json",
    },
  ],
]);
fetchUtils.fetch = async (url) => {
  const asset = assets.get(String(url));
  if (!asset)
    throw new Error("Unexpected remote resource requested by TWA generator.");
  return new Response(await readFile(asset.path), {
    headers: { "Content-Type": asset.type },
  });
};
await new TwaGenerator().createTwaProject(
  fileURLToPath(project),
  new TwaManifest(config),
  new ConsoleLog("PlugNear"),
);
// Bubblewrap 1.27's template still lists retired JCenter. All dependencies used
// here are available through Google Maven and Maven Central.
const gradleFile = new URL("build.gradle", project);
await writeFile(
  gradleFile,
  (await readFile(gradleFile, "utf8")).replaceAll(
    "jcenter()",
    "mavenCentral()",
  ),
);
await writeFile(
  new URL("manifest-checksum.txt", project),
  createHash("sha1")
    .update(await readFile(new URL("twa-manifest.json", project)))
    .digest("hex"),
);
const wrapperProperties = new URL(
  "gradle/wrapper/gradle-wrapper.properties",
  project,
);
await writeFile(
  wrapperProperties,
  (await readFile(wrapperProperties, "utf8")) +
    "\ndistributionSha256Sum=f397b287023acdba1e9f6fc5ea72d22dd63669d59ed4a289a29b1a76eee151c6\n",
);
console.log(
  "Generated PlugNear TWA Android project. No key or signed bundle was created.",
);
