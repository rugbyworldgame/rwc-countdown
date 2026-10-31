// Select once on general entry; direct match pages never redirect.
(function (root) {
  function choose(matches, now) {
    // Explicit ISO offsets (+03:00 for Moscow) make this independent of device timezone.
    const sorted = [...matches].sort((a,b) => Date.parse(a.start)-Date.parse(b.start));
    const moscowDay = timestamp => new Date(timestamp + 3 * 60 * 60 * 1000).toISOString().slice(0,10);
    const today = sorted.filter(m => moscowDay(Date.parse(m.start)) === moscowDay(now));
    const candidates = today.length ? today : sorted;
    const started = candidates.filter(m => Date.parse(m.start) <= now);
    return started[started.length-1] || candidates[0];
  }
  root.RugbyMatchSelection = {choose};
})(globalThis);
