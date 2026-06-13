import fs from "node:fs";
import path from "node:path";
const ex=new Set([".git","node_modules","dist"]); let checked=0;
function walk(dir){ for(const ent of fs.readdirSync(dir,{withFileTypes:true})){ if(ex.has(ent.name)) continue; const p=path.join(dir,ent.name); if(ent.isDirectory()) walk(p); else if(/\.(ts|mjs|json|md|css|yml)$/.test(p)){ const t=fs.readFileSync(p,"utf8"); checked++; if(/[ \t]$/m.test(t)){ console.error(`Trailing whitespace: ${p}`); process.exit(1);} }}}
walk(process.cwd()); console.log(`Lint passed for ${checked} files.`);
