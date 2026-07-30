const pageAliases = new Map([
  ["/", "/index.html"],
  ["/about", "/about.html"],
  ["/schedule", "/schedule.html"],
  ["/history", "/history.html"],
  ["/streams", "/streams.html"],
  ["/partners", "/partners.html"],
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = pageAliases.get(url.pathname) ?? url.pathname;
    const assetUrl = new URL(pathname, url);
    return env.ASSETS.fetch(new Request(assetUrl, request));
  },
};
