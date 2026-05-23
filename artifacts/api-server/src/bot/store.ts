import type { FcaApi } from "./types.js";

export interface BotState {
  api: FcaApi | null;
  online: boolean;
  uid: string | null;
  name: string | null;
  startedAt: Date | null;
  connectionType: string | null;
  cookieLoaded: boolean;
  reloading: boolean;
}

const state: BotState = {
  api: null,
  online: false,
  uid: null,
  name: null,
  startedAt: null,
  connectionType: null,
  cookieLoaded: false,
  reloading: false,
};

export function getState(): Readonly<BotState> {
  return state;
}

export function setState(patch: Partial<BotState>): void {
  Object.assign(state, patch);
}

export function getUptimeSeconds(): number {
  if (!state.startedAt || !state.online) return 0;
  return Math.floor((Date.now() - state.startedAt.getTime()) / 1000);
}
