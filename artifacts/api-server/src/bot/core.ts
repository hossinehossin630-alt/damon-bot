import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import type { FcaApi, FcaEvent, CookieEntry } from "./types.js";
import { getState, setState } from "./store.js";
import { handleEvent } from "./events/handler.js";
import { startCookieWatchdog, stopCookieWatchdog, setSelfWrite } from "./watchdog.js";
import { botLog } from "./botLogger.js";

const _require = createRequire(import.meta.url);

const DATA_DIR = process.env["DATA_DIR"] ?? path.join(process.cwd(), "data");
const COOKIE_FILE = path.join(DATA_DIR, "cookie.json");

let stopListener: (() => void) | null = null;
let mqttTimeout: NodeJS.Timeout | null = null;
let ioStatusEmitter: ((data: object) => void) | null = null;

export function setStatusEmitter(fn: (data: object) => void): void {
  ioStatusEmitter = fn;
}

export function getCookieFilePath(): string {
  return COOKIE_FILE;
}

export function loadCookie(): CookieEntry[] | null {
  try {
    if (!fs.existsSync(COOKIE_FILE)) return null;
    const raw = fs.readFileSync(COOKIE_FILE, "utf8").trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as CookieEntry[];
  } catch (err) {
    botLog.error("CORE", `Failed to load cookie: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

export function saveCookie(data: CookieEntry[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  setSelfWrite(true);
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(data, null, 2), "utf8");
  setTimeout(() => setSelfWrite(false), 1000);
}

function stopCurrentSession(): void {
  if (stopListener) {
    try { stopListener(); } catch { /* ignore */ }
    stopListener = null;
  }
  if (mqttTimeout) {
    clearTimeout(mqttTimeout);
    mqttTimeout = null;
  }
  const state = getState();
  if (state.api?.ctx?.mqttClient) {
    try { state.api.ctx.mqttClient.end(true); } catch { /* ignore */ }
  }
  setState({ api: null, online: false, uid: null, name: null, connectionType: null });
}

function emitStatus(): void {
  if (!ioStatusEmitter) return;
  const state = getState();
  ioStatusEmitter({
    online: state.online,
    uid: state.uid,
    name: state.name,
    connectionType: state.connectionType,
  });
}

export async function startBot(): Promise<void> {
  const cookies = loadCookie();
  if (!cookies) {
    botLog.warn("CORE", "No cookie.json found — bot waiting for cookie via panel");
    setState({ cookieLoaded: false });
    startCookieWatchdog(() => void reloadBot());
    return;
  }

  setState({ cookieLoaded: true });
  botLog.info("CORE", "Starting DAMON bot with c3c cookie...");

  return new Promise<void>((resolve) => {
    try {
      const login = _require("fca-unofficial") as (
        creds: { appState: CookieEntry[] },
        options: object,
        callback: (err: Error | null, api: FcaApi) => void,
      ) => void;

      login(
        { appState: cookies },
        {
          listenEvents: true,
          logLevel: "warn",
          updatePresence: false,
          selfListen: false,
          forceLogin: false,
          autoMarkRead: false,
          autoMarkDelivery: false,
          online: true,
          userAgent: "Mozilla/5.0 (Linux; Android 11; Redmi Note 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36",
        },
        (err: Error | null, api: FcaApi) => {
          if (err) {
            const msg = err.message ?? String(err);
            botLog.error("CORE", `Login failed: ${msg}`);
            setState({ online: false, cookieLoaded: false });
            emitStatus();
            resolve();
            return;
          }

          const uid = api.getCurrentUserID();
          setState({
            api,
            online: true,
            uid,
            startedAt: new Date(),
            connectionType: "mqtt",
          });

          botLog.ok("CORE", `Bot logged in — UID: ${uid}`);
          emitStatus();

          api.getUserInfo([uid], (infoErr, ret) => {
            if (!infoErr && ret?.[uid]) {
              setState({ name: ret[uid].name });
              botLog.ok("CORE", `Bot name: ${ret[uid].name}`);
              emitStatus();
            }
          });

          startListening(api, "mqtt");
          startCookieWatchdog(() => void reloadBot());
          resolve();
        },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      botLog.error("CORE", `Bot start exception: ${msg}`);
      resolve();
    }
  });
}

function extractFcaError(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    const summary = e["errorSummary"] ?? e["error_msg"] ?? e["error"] ?? "";
    const desc = e["errorDescription"] ?? "";
    if (summary) return desc ? `${summary}: ${desc}` : String(summary);
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

let pollAttempt = 0;

function startListening(api: FcaApi, mode: string): void {
  setState({ connectionType: mode });
  emitStatus();
  botLog.info("CORE", `Starting listener (${mode})...`);

  const stop = api.listen((err: unknown, event: FcaEvent) => {
    if (err) {
      const msg = extractFcaError(err);
      botLog.error("CORE", `Listener error (${mode}): ${msg}`);

      if (mode === "mqtt") {
        botLog.warn("CORE", "MQTT failed — switching to HTTP long-poll");
        pollAttempt = 0;
        setTimeout(() => startListening(api, "poll"), 2000);
      } else {
        pollAttempt++;
        const delay = Math.min(pollAttempt * 5000, 30000);
        botLog.warn("CORE", `Poll error, retry in ${delay / 1000}s (attempt ${pollAttempt})`);
        setTimeout(() => startListening(api, "poll"), delay);
      }
      return;
    }
    handleEvent(api, event).catch((e: unknown) => {
      botLog.error("CORE", `Event handler error: ${extractFcaError(e)}`);
    });
  });

  stopListener = stop;
  botLog.ok("CORE", `Listener started (${mode}) — UID: ${api.getCurrentUserID()}`);
}

export async function reloadBot(): Promise<void> {
  const state = getState();
  if (state.reloading) {
    botLog.warn("CORE", "Reload already in progress");
    return;
  }

  botLog.info("CORE", "Hot-reloading bot session...");
  setState({ reloading: true });
  stopCookieWatchdog();
  stopCurrentSession();

  await new Promise<void>((r) => setTimeout(r, 1500));

  setState({ reloading: false });
  await startBot();

  if (ioStatusEmitter) {
    ioStatusEmitter({ type: "bot-reload", ts: Date.now() });
  }
  botLog.ok("CORE", "Bot session reloaded successfully");
}
