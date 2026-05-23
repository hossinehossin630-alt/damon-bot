import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger.js";

export interface LogEntry {
  id: string;
  level: "INFO" | "WARN" | "ERROR" | "OK" | "DEBUG";
  tag: string;
  message: string;
  timestamp: string;
}

const MAX_LOGS = 500;
const logBuffer: LogEntry[] = [];

let ioEmitter: ((entry: LogEntry) => void) | null = null;

export function setLogEmitter(fn: (entry: LogEntry) => void): void {
  ioEmitter = fn;
}

function addLog(level: LogEntry["level"], tag: string, message: string): void {
  const entry: LogEntry = {
    id: randomUUID(),
    level,
    tag,
    message,
    timestamp: new Date().toISOString(),
  };

  logBuffer.unshift(entry);
  if (logBuffer.length > MAX_LOGS) logBuffer.length = MAX_LOGS;

  if (ioEmitter) ioEmitter(entry);

  switch (level) {
    case "ERROR":
      logger.error({ tag }, message);
      break;
    case "WARN":
      logger.warn({ tag }, message);
      break;
    default:
      logger.info({ tag, level }, message);
  }
}

export const botLog = {
  info: (tag: string, message: string) => addLog("INFO", tag, message),
  warn: (tag: string, message: string) => addLog("WARN", tag, message),
  error: (tag: string, message: string) => addLog("ERROR", tag, message),
  ok: (tag: string, message: string) => addLog("OK", tag, message),
  debug: (tag: string, message: string) => addLog("DEBUG", tag, message),
};

export function getLogs(limit = 100): LogEntry[] {
  return logBuffer.slice(0, limit);
}
