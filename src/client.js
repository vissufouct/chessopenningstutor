import config from "./config.json";
import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL || config.supabaseUrl;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  config.supabasePublishableKey;
export const configured = Boolean(url && key);
export const supabase = configured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
export async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}

export async function askCoach(payload) {
  const { data, error } = await supabase.functions.invoke("chess-coach", {
    body: payload,
  });
  if (error) {
    let message =
      "AI coaching is not available yet. The backend function and its secret need to be configured.";
    if (error.context instanceof Response) {
      try {
        const body = await error.context.json();
        if (typeof body.message === "string") message = body.message;
      } catch {}
    } else if (error.message?.includes("fetch"))
      message =
        "Could not reach the AI coach. Check your connection or use the ChatGPT handoff.";
    throw new Error(message);
  }
  if (!data?.reply)
    throw new Error("The coach returned no reply. Please try again.");
  return data;
}
