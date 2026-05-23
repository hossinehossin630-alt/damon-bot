import type { Command, FcaApi, FcaEvent } from "../types.js";

const myidCommand: Command = {
  name: "myid",
  description: "Get your Facebook UID",
  usage: "/myid",
  execute: async (api: FcaApi, event: FcaEvent) => {
    api.sendMessage(
      `Your Facebook UID: ${event.senderID}`,
      event.threadID,
    );
  },
};

export default myidCommand;
