import fs from "node:fs";

const m = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
const v = JSON.parse(fs.readFileSync("versions.json", "utf8"));
const source = fs.readFileSync("src/main.ts", "utf8");

const allowedManifestNamePattern = /^[A-Za-z0-9 ()+-]+$/;
const lowerName = m.name.toLowerCase();
const checks=[
 [fs.existsSync("README.md"),"README"],[fs.existsSync("LICENSE"),"LICENSE"],[fs.existsSync("main.js"),"main.js"],[fs.existsSync("styles.css"),"styles.css"],
 [m.id==="folder-sort-view","id"],[m.name==="Folder Sort View","name"],[m.version===p.version,"version match"],[v[m.version]===m.minAppVersion,"versions mapping"],
 [/^[a-z-]+$/.test(m.id),"id format"],[!m.id.includes("obsidian"),"id avoids obsidian"],[!m.id.endsWith("plugin"),"id avoids plugin suffix"],
 [allowedManifestNamePattern.test(m.name),"name uses allowed punctuation"],[!lowerName.includes("obsidian")&&!lowerName.includes("obsi-")&&!lowerName.includes("-sidian"),"name avoids obsidian"],
 [typeof m.description==="string"&&m.description.length>0&&!m.description.toLowerCase().startsWith("this is a plugin"),"description"],
 [!m.description.toLowerCase().includes("obsidian"),"description avoids obsidian"],
 [!source.includes("detachLeavesOfType"),"does not detach leaves in onunload"],
 [!source.includes("revealLeaf("),"does not use revealLeaf with current minAppVersion"],
 [fs.existsSync(".github/workflows/release.yml"),"release workflow"],[fs.existsSync("SECURITY.md"),"security"],[fs.existsSync("CONTRIBUTING.md"),"contributing"],
];
const fail=checks.filter(([ok])=>!ok).map(([,m])=>m); if(fail.length){ for(const f of fail) console.error(`FAIL: ${f}`); process.exit(1);} console.log("Obsidian community submission checks passed.");
