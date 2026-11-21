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
