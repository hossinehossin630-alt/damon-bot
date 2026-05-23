import fs from "node:fs";
import path from "node:path";
import { botLog } from "./botLogger.js";

export interface Admin {
  uid: string;
  name: string;
  addedAt: string;
}

const DATA_DIR = process.env["DATA_DIR"] ?? path.join(process.cwd(), "data");
const ADMINS_FILE = path.join(DATA_DIR, "admins.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadAdmins(): Admin[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(ADMINS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ADMINS_FILE, "utf8")) as Admin[];
  } catch {
    botLog.warn("ADMIN", "Failed to load admins, returning empty list");
    return [];
  }
}

export function saveAdmins(admins: Admin[]): void {
  ensureDataDir();
  fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), "utf8");
}

export function isAdmin(uid: string): boolean {
  const admins = loadAdmins();
  return admins.some((a) => a.uid === uid);
}

export function addAdmin(uid: string, name: string): Admin | null {
  const admins = loadAdmins();
  if (admins.some((a) => a.uid === uid)) return null;
  const admin: Admin = { uid, name, addedAt: new Date().toISOString() };
  admins.push(admin);
  saveAdmins(admins);
  botLog.ok("ADMIN", `Added admin: ${name} (${uid})`);
  return admin;
}

export function removeAdmin(uid: string): boolean {
  const admins = loadAdmins();
  const idx = admins.findIndex((a) => a.uid === uid);
  if (idx === -1) return false;
  const removed = admins.splice(idx, 1)[0];
  saveAdmins(admins);
  botLog.ok("ADMIN", `Removed admin: ${removed.name} (${uid})`);
  return true;
}
