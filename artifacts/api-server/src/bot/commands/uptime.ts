import type { Command, FcaApi, FcaEvent } from "../types.js";
import { getUptimeSeconds } from "../store.js";

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

const uptimeCommand: Command = {
  name: "uptime",
  description: "Shows how long DAMON bot has been running",
  usage: "/uptime",
  execute: async (api: FcaApi, event: FcaEvent) => {
    const seconds = getUptimeSeconds();
    const msg = `DAMON Bot Uptime: ${formatUptime(seconds)}`;
    api.sendMessage(msg, event.threadID);
  },
};

export default uptimeCommand;
