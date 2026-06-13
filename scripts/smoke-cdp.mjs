import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const PLUGIN_ID = "folder-sort-view";
const DEFAULT_PORT = 9222;

async function main() {
  if (process.platform === "linux" && os.release().toLowerCase().includes("microsoft") && !process.env.FOLDER_SORT_VIEW_CDP_WINDOWS_NODE) {
    const scriptPath = path.resolve(process.argv[1]);
    const wslpath = spawnSync("wslpath", ["-w", scriptPath], { encoding: "utf8" });
    if (wslpath.status !== 0) throw new Error(`wslpath failed: ${wslpath.stderr || wslpath.stdout}`);
    const command = `$env:FOLDER_SORT_VIEW_CDP_WINDOWS_NODE='1'; node '${wslpath.stdout.trim().replaceAll("'", "''")}'`;
    const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", command], { stdio: "inherit" });
    process.exit(result.status ?? 1);
  }

  const target = await findTarget("127.0.0.1", DEFAULT_PORT);
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  try {
    await client.send("Runtime.enable");
    const result = await evaluateSmoke(client);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    client.close();
  }
}

async function findTarget(host, port) {
  const response = await fetch(`http://${host}:${port}/json/list`);
  if (!response.ok) throw new Error(`CDP endpoint returned ${response.status}`);
  const targets = await response.json();
  const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
  if (!target) throw new Error("No CDP page target found");
  return target;
}

async function evaluateSmoke(client) {
  const response = await client.send("Runtime.evaluate", {
    expression: `(${browserSmoke.toString()})(${JSON.stringify({ pluginId: PLUGIN_ID })})`,
    awaitPromise: true,
    returnByValue: true,
    timeout: 60_000,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text ?? JSON.stringify(response.exceptionDetails));
  return response.result.value;
}

async function browserSmoke({ pluginId }) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const assert = (condition, message, details = {}) => {
    if (!condition) {
      const error = new Error(message);
      error.details = details;
      throw error;
    }
  };

  assert(window.app?.vault?.getName?.() === "obsidian-test-vault", "Wrong vault is open", { vault: window.app?.vault?.getName?.() });
  await window.app.plugins.loadManifests?.();
  if (window.app.plugins.plugins[pluginId]) {
    await window.app.plugins.disablePlugin(pluginId);
    await window.app.plugins.unloadPlugin(pluginId);
    await sleep(300);
  }
  await window.app.plugins.loadPlugin(pluginId);
  await sleep(500);
  await window.app.commands.executeCommandById(`${pluginId}:open-folder-sort-view`);
  await sleep(500);
  const leaf = window.app.workspace.getLeavesOfType("folder-sort-view")[0];
  assert(Boolean(leaf), "Folder Sort View leaf did not open");
  const text = leaf.view.containerEl.innerText;
  assert(text.includes("Folder Sort View"), "View title missing", { text });
  assert(!window.app.plugins.plugins[pluginId].constructor.toString().includes("getSortedFolderItems"), "Plugin should not patch native File Explorer");
  const buttons = [...leaf.view.containerEl.querySelectorAll("button.folder-sort-view__folder")].map((el) => el.textContent.trim()).filter(Boolean);
  assert(buttons.length >= 3, "Not enough root folders to prove ordering", { buttons });
  const sorted = [...buttons].sort((a, b) => b.localeCompare(a, undefined, { sensitivity: "base", numeric: true }));
  assert(JSON.stringify(buttons) === JSON.stringify(sorted), "Root folder buttons are not Z-to-A", { buttons, sorted });
  return { ok: true, viewType: leaf.view.getViewType(), rootFolders: buttons.slice(0, 8) };
}

class CdpClient {
  static connect(url) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      const client = new CdpClient(socket);
      socket.addEventListener("open", () => resolve(client), { once: true });
      socket.addEventListener("error", (event) => reject(new Error(event.message ?? "WebSocket connection failed")), { once: true });
    });
  }
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.socket.addEventListener("message", (event) => this.onMessage(event));
  }
  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  close() { this.socket.close(); }
  onMessage(event) {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    if (message.error) pending.reject(new Error(`${message.error.message}: ${message.error.data ?? ""}`.trim()));
    else pending.resolve(message.result);
  }
}

await main();
