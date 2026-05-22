import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("app_settings").select("key,value");
  const map: Record<string, any> = {};
  (data ?? []).forEach((r) => (map[r.key] = r.value));
  return {
    pricing: map.pricing ?? { markup_percent: 20, exchange_rate_ngn_per_usd: 1600 },
    bank: map.bank ?? { account_name: "", bank: "", account_number: "" },
  };
});

export const updatePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      markup_percent: z.number().min(0).max(500),
      exchange_rate_ngn_per_usd: z.number().min(1).max(100000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("app_settings").upsert({ key: "pricing", value: data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
