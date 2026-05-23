import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import {
  getCookieFilePath,
  saveCookie,
  reloadBot,
  loadCookie,
} from "../bot/core.js";
import { botLog } from "../bot/botLogger.js";
import type { CookieEntry } from "../bot/types.js";

const DATA_DIR = process.env["DATA_DIR"] ?? path.join(process.cwd(), "data");
const META_FILE = path.join(DATA_DIR, "cookie-meta.json");

interface CookieMeta {
  updatedAt: string | null;
}

function loadMeta(): CookieMeta {
  try {
    if (!fs.existsSync(META_FILE)) return { updatedAt: null };
    return JSON.parse(fs.readFileSync(META_FILE, "utf8")) as CookieMeta;
  } catch {
    return { updatedAt: null };
  }
}

function saveMeta(meta: CookieMeta): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), "utf8");
}

const router = Router();

router.get("/cookie", (_req, res) => {
  const filePath = getCookieFilePath();
  const exists = fs.existsSync(filePath);
  const meta = loadMeta();

  let preview: string | null = null;
  if (exists) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw) as CookieEntry[];
      const cUser = parsed.find((c) => c.key === "c_user");
      const xs = parsed.find((c) => c.key === "xs");
      const count = parsed.length;
      preview = `${count} cookies${cUser ? `, c_user: ${cUser.value.slice(0, 6)}...` : ""}${xs ? ", xs: ***" : ""}`;
    } catch {
      preview = "Cookie file exists but could not be parsed";
    }
  }

  res.json({
    loaded: exists,
    preview,
    updatedAt: meta.updatedAt,
  });
});

router.put("/cookie", async (req, res) => {
  const { cookie } = req.body as { cookie?: string };
  if (!cookie) {
    res.status(400).json({ error: "cookie field is required" });
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cookie);
  } catch {
    res.status(400).json({ error: "Invalid JSON — cookie must be a valid JSON string" });
    return;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    res.status(400).json({ error: "Cookie must be a non-empty JSON array (c3c format)" });
    return;
  }

  const entries = parsed as CookieEntry[];
  botLog.info("COOKIE", `Updating cookie via panel — ${entries.length} entries`);

  saveCookie(entries);
  saveMeta({ updatedAt: new Date().toISOString() });

  res.json({ success: true, message: "Cookie updated — bot reloading" });

  reloadBot().catch((err: unknown) => {
    botLog.error("COOKIE", `Reload after cookie update failed: ${err instanceof Error ? err.message : String(err)}`);
  });
});

export default router;
