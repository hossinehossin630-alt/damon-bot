import type { Command, FcaApi, FcaEvent } from "../types.js";

const helpCommand: Command = {
  name: "help",
  description: "Shows available commands",
  usage: "/help",
  execute: async (api: FcaApi, event: FcaEvent, _args: string[]) => {
    const commands = [
      "/uptime - Show how long the bot has been running",
      "/ping   - Check if the bot is alive",
      "/myid   - Get your Facebook UID",
      "/help   - Show this message",
    ];
    const msg = "[ DAMON Bot Commands ]\n" + commands.join("\n");
    api.sendMessage(msg, event.threadID);
  },
};

export default helpCommand;
