import type { FcaApi, FcaEvent } from "../types.js";
import { isAdmin } from "../admin.js";
import { getCommand } from "../commands/index.js";
import { botLog } from "../botLogger.js";

const PREFIX = "/";

export async function handleEvent(api: FcaApi, event: FcaEvent): Promise<void> {
  if (!event || event.type !== "message") return;
  if (!event.body) return;

  const body = event.body.trim();
  const senderID = event.senderID;
  const botUID = api.getCurrentUserID();

  if (senderID === botUID) return;

  if (!isAdmin(senderID)) {
    return;
  }

  if (!body.startsWith(PREFIX)) return;

  const parts = body.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = parts[0]?.toLowerCase() ?? "";
  const args = parts.slice(1);

  const command = getCommand(commandName);
  if (!command) {
    botLog.warn("CMD", `Unknown command: ${commandName} from ${senderID}`);
    api.sendMessage(
      `Unknown command: /${commandName}\nUse /help to see available commands.`,
      event.threadID,
    );
    return;
  }

  botLog.info("CMD", `Executing /${commandName} from ${senderID}`);
  try {
    await command.execute(api, event, args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    botLog.error("CMD", `Command /${commandName} failed: ${msg}`);
    api.sendMessage(`Command failed: ${msg}`, event.threadID);
  }
}
