import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { generateImageAsync } from "@expo/image-utils";
import { cp, mkdir, rm, readdir, writeFile, readFile } from "node:fs/promises";
const root = new URL("./", import.meta.url),
  dist = new URL("./dist/", root);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(new URL("./public/", root), dist, { recursive: true });
const app = new URL("../mobile/dist-web/", root);
await mkdir(new URL("./app/", dist), { recursive: true });
await cp(new URL("index.html", app), new URL("./app/index.html", dist));
for (const entry of await readdir(app)) {
  if (!["index.html", "metadata.json"].includes(entry))
    await cp(new URL(entry, app), new URL(entry, dist), { recursive: true });
}
// Build only public static assets into the offline cache; no API, auth or map tiles.
await mkdir(new URL("./app/icons/", dist), { recursive: true });
for (const size of [192, 512]) {
  const generated = await generateImageAsync(
    { projectRoot: fileURLToPath(root), cacheType: "pwa-icons" },
    {
      src: fileURLToPath(new URL("../mobile/assets/icon.png", root)),
      width: size,
      height: size,
      resizeMode: "contain",
      backgroundColor: "#FAFAF5",
    },
  );
  await writeFile(
    new URL(`./app/icons/icon-${size}.png`, dist),
    generated.source,
  );
}
await cp(
  new URL("./pwa/offline.html", root),
  new URL("./app/offline.html", dist),
);
await cp(new URL("./pwa/register.js", root), new URL("./app/pwa.js", dist));
await writeFile(
  new URL("./app/manifest.webmanifest", dist),
  JSON.stringify({
    id: "/app/",
    name: "PlugNear",
    short_name: "PlugNear",
    description:
      "Find a charger, request a session and pay your host directly by UPI.",
    start_url: "/app/",
    scope: "/app/",
    display: "standalone",
    background_color: "#FAFAF5",
    theme_color: "#2449eb",
    icons: [192, 512].map((size) => ({
      src: `/app/icons/icon-${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any",
    })),
  }),
);
const appHtmlUrl = new URL("./app/index.html", dist);
const html = await readFile(appHtmlUrl, "utf8");
await writeFile(
  appHtmlUrl,
  html.replace(
    "</head>",
    '<link rel="manifest" href="/app/manifest.webmanifest"><meta name="theme-color" content="#2449eb"><meta name="apple-mobile-web-app-capable" content="yes"><link rel="apple-touch-icon" href="/app/icons/icon-192.png"><script src="/app/pwa.js" defer></script></head>',
  ),
);
async function publicAssets(dir, prefix = "") {
  let paths = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory())
      paths.push(
        ...(await publicAssets(new URL(entry.name + "/", dir), path + "/")),
      );
    else paths.push(path);
  }
  return paths;
}
const staticPaths = (await publicAssets(dist)).filter(
  (path) =>
    path.startsWith("_expo/") ||
    path.startsWith("assets/assets/") ||
    path.startsWith("app/"),
);
const version = createHash("sha256");
for (const path of staticPaths)
  version.update(await readFile(new URL(path, dist)));
const cacheName = "plugnear-shell-" + version.digest("hex").slice(0, 16);
await writeFile(
  new URL("./app/sw.js", dist),
  `const CACHE=${JSON.stringify(cacheName)};const ASSETS=${JSON.stringify(staticPaths.map((p) => "/" + p))};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('plugnear-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request;const url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match('/app/offline.html')));return;}
if(url.search||!ASSETS.includes(url.pathname))return;event.respondWith(caches.open(CACHE).then(cache=>cache.match(url.pathname).then(hit=>hit||fetch(request))));});`,
);
await writeFile(
  new URL("./vercel.json", dist),
  JSON.stringify(
    {
      cleanUrls: true,
      redirects: [
        {
          source: "/",
          has: [{ type: "host", value: "app.plugnear.in" }],
          destination: "/app/",
          permanent: false,
        },
      ],
      rewrites: [
        { source: "/app", destination: "/app/index.html" },
        { source: "/app/auth/callback", destination: "/app/index.html" },
      ],
      headers: [
        {
          source: "/app/sw.js",
          headers: [
            {
              key: "Cache-Control",
              value: "no-cache, no-store, must-revalidate",
            },
          ],
        },
        {
          source: "/app/index.html",
          headers: [{ key: "Cache-Control", value: "no-cache" }],
        },
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
          ],
        },
      ],
    },
    null,
    2,
  ),
);
console.log("Built PlugNear website with early-access app at /app/.");
