// Shared pure policy: select once on entry, never interrupt an open player.
(function (root) {
  function choose(matches, now) {
    const sorted = [...matches].sort((a,b) => Date.parse(a.start)-Date.parse(b.start));
    const live = sorted.filter(m => m.status === 'live');
    if (live.length) return live[live.length-1];
    const eligible = sorted.filter(m => !['finished','cancelled','postponed'].includes(m.status));
    // Three hours is a selection grace period, NOT an assertion that a match ended.
    const started = eligible.filter(m => Date.parse(m.start)<=now && now-Date.parse(m.start)<3*3600000);
    if (started.length) return started[started.length-1];
    return eligible.find(m => Date.parse(m.start)>now) || eligible[eligible.length-1] || sorted[sorted.length-1];
  }
  root.RugbyMatchSelection = {choose};
})(globalThis);
