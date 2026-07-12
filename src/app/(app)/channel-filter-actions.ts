"use server";

import { cookies } from "next/headers";
import { CHANNEL_FILTER_COOKIE, type ChannelFilter } from "@/lib/channel-filter";

export async function setChannelFilterAction(value: ChannelFilter) {
  const store = await cookies();
  store.set(CHANNEL_FILTER_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
