import { cookies } from "next/headers";
import type { Channel } from "./planner";

export const CHANNEL_FILTER_COOKIE = "stpm_channel_filter";
export type ChannelFilter = Channel;

export async function getChannelFilter(): Promise<ChannelFilter> {
  const store = await cookies();
  const value = store.get(CHANNEL_FILTER_COOKIE)?.value;
  return value === "innie" ? "innie" : "outie";
}
