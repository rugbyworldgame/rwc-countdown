import test from 'node:test';
import assert from 'node:assert/strict';
import {startWebGL,rendererReport} from './renderer-startup.js';
function canvases(results){let i=0;return ()=>({addEventListener(){},getContext(type){assert.equal(type,'webgl2');return results[i++]}})}
const THREE={WebGLRenderer:class{constructor(options){this.options=options}}};
test('WebGL starts on the first canvas when available',()=>{const r=startWebGL(THREE,canvases([{}]));assert.ok(r.renderer);assert.equal(r.antialias,true);assert.equal(r.attempts.length,0)});
test('retry without antialias uses another canvas',()=>{const r=startWebGL(THREE,canvases([null,{}]));assert.ok(r.renderer);assert.equal(r.antialias,false);assert.equal(r.attempts.length,1)});
test('context refusal reports reasons and allows SVG',()=>{const r=startWebGL(THREE,canvases([null,null]));assert.equal(r.renderer,null);assert.equal(r.attempts.length,2);assert.match(rendererReport('170',r),/резервный SVG/)});
test('renderer bugs are not silently reclassified as missing WebGL',()=>{assert.throws(()=>startWebGL({WebGLRenderer:class{constructor(){throw Error('renderer bug')}}},canvases([{}])),/renderer bug/)});
