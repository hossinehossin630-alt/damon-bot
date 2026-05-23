import { Router } from "express";
import { getLogs } from "../bot/botLogger.js";

const router = Router();

router.get("/logs", (req, res) => {
  const raw = req.query["limit"];
  const limit = raw ? parseInt(String(raw), 10) : 100;
  res.json(getLogs(isNaN(limit) ? 100 : Math.min(limit, 500)));
});

export default router;
