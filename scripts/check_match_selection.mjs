import assert from 'node:assert/strict';
import '../assets/js/match-selection.js';
const choose=globalThis.RugbyMatchSelection.choose;
const base=Date.parse('2026-10-24T14:45:00+03:00');
const fixture=(id,minutes,status='scheduled')=>({id,start:new Date(base+minutes*60000).toISOString(),status});
const a=fixture('a',0),b=fixture('b',140),c=fixture('c',315),d=fixture('d',435);
assert.equal(choose([d,c,b,a],base-1).id,'a');
assert.equal(choose([a,b,c,d],base+135*60000).id,'a'); // over 2h, still allowed
assert.equal(choose([a,b,c,d],base+141*60000).id,'b'); // newest start when overlapping
assert.equal(choose([a,b,c,d],base+305*60000).id,'b');
assert.equal(choose([a,b,c,d],base+10*3600000).id,'d');
assert.equal(choose([{...a,status:'live'},b,c,d],base+150*60000).id,'a');
assert.equal(choose([{...a,status:'finished'},b,c,d],base+60*60000).id,'b');
assert.equal(choose([a],base).id,'a');assert.equal(choose([],base),undefined);
assert.equal(choose([{...a,status:'postponed'},b],base).id,'b');
console.log('Selection: future/start/overlap/delay/explicit live/finished/single/empty PASS');
