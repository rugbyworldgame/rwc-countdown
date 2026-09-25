import { cp, mkdir, readdir, rm } from 'node:fs/promises';
// GitHub Pages publishes root; .build is a complete local verification artifact.
const output = new URL('../.build/', import.meta.url);
await rm(output, {recursive:true, force:true});
await mkdir(output, {recursive:true});
const root = new URL('../', import.meta.url);
const names = (await readdir(root)).filter(name => /\.(html|js|svg|xml|txt)$/.test(name));
for (const name of [...names,'assets','match-center','checks']) await cp(new URL(name,root),new URL(name,output),{recursive:true});
console.log('Built all public pages and assets into .build.');
