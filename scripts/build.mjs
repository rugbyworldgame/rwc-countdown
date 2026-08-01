import { cp, mkdir, readFile, rm } from "node:fs/promises";

const files = [
  "index.html",
  "about.html",
  "schedule.html",
  "history.html",
  "streams.html",
  "partners.html",
  "robots.txt",
  "sitemap.xml",
  "favicon.svg",
  "menu.html",
  "menu.js",
  "assets/css/site.css",
  "assets/css/menu.css"
];

await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");

const content = {};
for (const path of files) {
  content[`/${path}`] = await readFile(path, "utf8");
}

const worker = `
const files = ${JSON.stringify(content)};
const aliases = {
  "/": "/index.html",
  "/about": "/about.html",
  "/schedule": "/schedule.html",
  "/history": "/history.html",
  "/streams": "/streams.html",
  "/partners": "/partners.html"
};
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const requested = decodeURIComponent(url.pathname);
    const path = aliases[requested] || requested;
    const body = files[path];
    if (body === undefined) {
      return new Response("Страница не найдена", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    const extension = path.slice(path.lastIndexOf("."));
    return new Response(request.method === "HEAD" ? null : body, {
      status: 200,
      headers: {
        "content-type": types[extension] || "application/octet-stream",
        "cache-control": path.endsWith(".html") ? "no-cache" : "public, max-age=3600",
        "x-content-type-options": "nosniff"
      }
    });
  }
};
`;

await import("node:fs/promises").then(({ writeFile }) => writeFile("dist/server/index.js", worker));

for (const path of files) {
  await mkdir(`dist/${path.split("/").slice(0, -1).join("/") || "."}`, { recursive: true });
  await cp(path, `dist/${path}`);
}
