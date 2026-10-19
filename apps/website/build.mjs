import { cp, mkdir, rm, readdir, writeFile } from "node:fs/promises";
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
await writeFile(
  new URL("./vercel.json", dist),
  JSON.stringify(
    {
      cleanUrls: true,
      rewrites: [
        { source: "/app", destination: "/app/index.html" },
        { source: "/app/:path*", destination: "/app/index.html" },
      ],
      headers: [
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
