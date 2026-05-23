import type { Command, FcaApi, FcaEvent } from "../types.js";

const pingCommand: Command = {
  name: "ping",
  description: "Check if the bot is alive",
  usage: "/ping",
  execute: async (api: FcaApi, event: FcaEvent) => {
    const now = Date.now();
    const latency = event.timestamp ? now - event.timestamp : 0;
    api.sendMessage(
      `DAMON Bot is online. Latency: ${latency}ms`,
      event.threadID,
    );
  },
};

export default pingCommand;
