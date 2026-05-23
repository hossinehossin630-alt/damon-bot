import type { Command } from "../types.js";
import uptimeCommand from "./uptime.js";
import helpCommand from "./help.js";
import pingCommand from "./ping.js";
import myidCommand from "./myid.js";

const commandRegistry = new Map<string, Command>();

const allCommands: Command[] = [
  uptimeCommand,
  helpCommand,
  pingCommand,
  myidCommand,
];

for (const cmd of allCommands) {
  commandRegistry.set(cmd.name.toLowerCase(), cmd);
}

export function getCommand(name: string): Command | undefined {
  return commandRegistry.get(name.toLowerCase());
}

export function getAllCommands(): Command[] {
  return allCommands;
}
