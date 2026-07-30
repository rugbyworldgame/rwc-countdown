import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("worker/index.js", "dist/server/index.js");

for (const path of [
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
  "assets"
]) {
  await cp(path, `dist/${path}`, { recursive: true });
}
