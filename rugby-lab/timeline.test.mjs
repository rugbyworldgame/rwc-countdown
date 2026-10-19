import test from 'node:test';
import assert from 'node:assert/strict';
import {isLocalModelPath, phaseAt, clipTimeAt} from './timeline.js';
test('GLB: local files only, no traversal or external addresses', () => {
  for (const path of ['assets/models/carrier.glb','assets/models/player-2.GLB']) assert.ok(isLocalModelPath(path));
  for (const path of ['https://other/model.glb','assets/models/../x.glb','assets/models/a.glb?x','assets/models/aXglb',null,{}]) assert.equal(isLocalModelPath(path), false);
});
test('phase boundaries and backwards scrubbing', () => {
  assert.deepEqual(phaseAt('carrier',3.8), {start:3.8,name:'tackle'});
  assert.equal(phaseAt('carrier',12).name,'ground');
  assert.equal(phaseAt('carrier',0).name,'run');
  assert.equal(phaseAt('tackler',5.6).name,'release');
  assert.equal(phaseAt('support',9).name,'contest');
});
test('clips start at phase boundary; tackle does not repeat', () => {
  const phase=phaseAt('carrier',3.8);
  assert.equal(clipTimeAt(phase,3.8,1),0);
  assert.ok(clipTimeAt(phase,5.8,1)>.99);
  assert.equal(clipTimeAt(phase,4.3,1),.5);
  assert.equal(clipTimeAt(phase,4.3,0),0);
  assert.equal(clipTimeAt({name:'run',start:6},8.5,1),.5);
});
