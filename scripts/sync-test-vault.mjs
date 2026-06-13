import fs from "node:fs/promises";
import path from "node:path";
const PLUGIN_ID="folder-sort-view";
const target=process.argv[2] ?? `/mnt/c/Users/viggo/github/obsidian-test-vault/.obsidian/plugins/${PLUGIN_ID}`;
if(!target.includes("obsidian-test-vault") || target.includes("Syncthing/vault")) throw new Error(`Refusing unsafe target: ${target}`);
await fs.mkdir(target,{recursive:true});
const copied=[];
for(const artifact of ["main.js","manifest.json","styles.css"]){ const dest=path.join(target,artifact); await fs.copyFile(artifact,dest); copied.push({artifact,destination:dest}); }
console.log(JSON.stringify({ok:true,target,copied},null,2));
