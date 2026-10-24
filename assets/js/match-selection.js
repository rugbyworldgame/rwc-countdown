// Select once on general entry; direct match pages never redirect.
(function (root) {
  function choose(matches, now) {
    // Explicit ISO offsets (+03:00 for Moscow) make this independent of device timezone.
    const sorted = [...matches].sort((a,b) => Date.parse(a.start)-Date.parse(b.start));
    const started = sorted.filter(m => Date.parse(m.start) <= now);
    return started[started.length-1] || sorted[0];
  }
  root.RugbyMatchSelection = {choose};
})(globalThis);
