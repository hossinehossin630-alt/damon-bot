import { Router } from "express";
import { getState, getUptimeSeconds } from "../bot/store.js";
import { loadAdmins } from "../bot/admin.js";
import { reloadBot, loadCookie } from "../bot/core.js";
import { botLog } from "../bot/botLogger.js";

const router = Router();

router.get("/bot/status", (_req, res) => {
  const state = getState();
  const admins = loadAdmins();
  res.json({
    online: state.online,
    uid: state.uid,
    name: state.name,
    uptimeSeconds: getUptimeSeconds(),
    startedAt: state.startedAt?.toISOString() ?? null,
    connectionType: state.connectionType,
    adminCount: admins.length,
    cookieLoaded: state.cookieLoaded,
  });
});

router.post("/bot/reload", async (_req, res) => {
  botLog.info("API", "Manual reload triggered via panel");
  reloadBot().catch((err: unknown) => {
    botLog.error("API", `Reload error: ${err instanceof Error ? err.message : String(err)}`);
  });
  res.json({ success: true, message: "Bot reload initiated" });
});

export default router;
