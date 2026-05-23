import { Router } from "express";
import {
  loadAdmins,
  addAdmin,
  removeAdmin,
} from "../bot/admin.js";

const router = Router();

router.get("/admins", (_req, res) => {
  res.json(loadAdmins());
});

router.post("/admins", (req, res) => {
  const { uid, name } = req.body as { uid?: string; name?: string };
  if (!uid || !name) {
    res.status(400).json({ error: "uid and name are required" });
    return;
  }
  const admin = addAdmin(String(uid), String(name));
  if (!admin) {
    res.status(409).json({ error: "Already an admin" });
    return;
  }
  res.status(201).json(admin);
});

router.delete("/admins/:uid", (req, res) => {
  const { uid } = req.params;
  if (!uid) {
    res.status(400).json({ error: "uid is required" });
    return;
  }
  const removed = removeAdmin(uid);
  if (!removed) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }
  res.json({ success: true, message: "Admin removed" });
});

export default router;
