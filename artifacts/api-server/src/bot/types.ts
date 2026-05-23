export interface FcaApi {
  listen: (callback: (err: Error | null, event: FcaEvent) => void) => () => void;
  sendMessage: (message: string | FcaMessage, threadID: string, callback?: (err: Error | null) => void) => void;
  getCurrentUserID: () => string;
  getUserInfo: (ids: string[], callback: (err: Error | null, ret: Record<string, FcaUserInfo>) => void) => void;
  logout: (callback?: (err: Error | null) => void) => void;
  ctx?: {
    mqttClient?: { end: (force?: boolean) => void };
  };
}

export interface FcaEvent {
  type: string;
  threadID: string;
  senderID: string;
  body?: string;
  messageID?: string;
  timestamp?: number;
  attachments?: unknown[];
  logMessageType?: string;
}

export interface FcaMessage {
  body?: string;
  attachment?: unknown;
  mentions?: unknown[];
}

export interface FcaUserInfo {
  name: string;
  firstName?: string;
  gender?: number;
  type?: string;
  isFriend?: boolean;
  isBirthday?: boolean;
  vanity?: string;
  thumbSrc?: string;
  profileUrl?: string;
}

export interface CookieEntry {
  key: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  hostOnly?: boolean;
  creation?: string;
  lastAccessed?: string;
  expires?: number | string;
  sameSite?: string;
}

export interface Command {
  name: string;
  description: string;
  usage: string;
  execute: (api: FcaApi, event: FcaEvent, args: string[]) => Promise<void>;
}
