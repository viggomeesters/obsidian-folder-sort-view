import fs from "node:fs/promises";
const main=await fs.readFile("main.js","utf8");
const manifest=JSON.parse(await fs.readFile("manifest.json","utf8"));
const pkg=JSON.parse(await fs.readFile("package.json","utf8"));
const checks=[
 [manifest.id==="folder-sort-view","manifest id"],
 [manifest.version===pkg.version,"manifest/package version match"],
 [main.includes("folder-sort-view"),"bundle contains view id"],
 [!main.includes("getSortedFolderItems"),"bundle must not patch native File Explorer sorting"],
 [!main.includes("reconcileDeletion"),"bundle must not patch file-system adapter"],
];
for(const [ok,msg] of checks){ if(!ok){ console.error(msg); process.exit(1); }}
console.log("Folder Sort View smoke checks passed.");
