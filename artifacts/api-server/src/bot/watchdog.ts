import path from "node:path";
import chokidar from "chokidar";
import { botLog } from "./botLogger.js";

const DATA_DIR = process.env["DATA_DIR"] ?? path.join(process.cwd(), "data");
const COOKIE_FILE = path.join(DATA_DIR, "cookie.json");

let watcher: chokidar.FSWatcher | null = null;
let debounceTimer: NodeJS.Timeout | null = null;
let selfWrite = false;

export function setSelfWrite(value: boolean): void {
  selfWrite = value;
}

export function startCookieWatchdog(onChanged: () => void): void {
  if (watcher) {
    watcher.close().catch(() => {});
  }

  watcher = chokidar.watch(COOKIE_FILE, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  const trigger = () => {
    if (selfWrite) {
      botLog.debug("WATCHDOG", "Cookie change by self-write, skipping");
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      botLog.ok("WATCHDOG", "cookie.json changed — hot-reloading bot session");
      onChanged();
    }, 800);
  };

  watcher.on("add", trigger);
  watcher.on("change", trigger);

  watcher.on("error", (err) => {
    botLog.error("WATCHDOG", `Cookie watcher error: ${err instanceof Error ? err.message : String(err)}`);
  });

  botLog.info("WATCHDOG", `Watching ${COOKIE_FILE} for changes`);
}

export function stopCookieWatchdog(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (watcher) {
    watcher.close().catch(() => {});
    watcher = null;
  }
}
