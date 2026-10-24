import assert from 'node:assert/strict';
import '../assets/js/match-selection.js';
const choose=globalThis.RugbyMatchSelection.choose;
const matches=['14:45','17:05','20:00','22:00'].map((time,id)=>({id,start:`2026-10-24T${time}:00+03:00`}));
const unsorted=[...matches].reverse();
assert.equal(choose(unsorted,Date.parse('2026-10-24T00:00:00+03:00')).id,0);
for (const m of matches) {
  const start=Date.parse(m.start);
  assert.equal(choose(unsorted,start-1).id,Math.max(0,m.id-1));
  assert.equal(choose(unsorted,start).id,m.id);
  assert.equal(choose(unsorted,start+1).id,m.id);
}
assert.equal(choose(matches,Date.parse('2026-12-01T00:00:00Z')).id,3);
assert.equal(choose([{...matches[0],status:'live'},...matches.slice(1)],Date.parse(matches[2].start)).id,2);
assert.equal(choose(matches.map(m=>({...m,status:'finished'})),Date.parse(matches[3].start)).id,3);
// A long gap must not select the future fixture prematurely.
assert.equal(choose([matches[0],matches[3]],Date.parse('2026-10-24T21:59:59+03:00')).id,0);
assert.deepEqual(unsorted,[...matches].reverse()); // no reordering of caller data
assert.equal(choose([matches[0]],0).id,0);
assert.equal(choose([],0),undefined);
console.log('Selection: all Moscow start boundaries, long gap, last retained, statuses, single/empty PASS');
