import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("transactions").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const myStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: txs } = await context.supabase
      .from("transactions").select("type,amount").eq("user_id", context.userId);
    let spent = 0;
    (txs ?? []).forEach((t: any) => { if (Number(t.amount) < 0) spent += Math.abs(Number(t.amount)); });
    const { count: activeNumbers } = await context.supabase
      .from("number_orders").select("*", { count: "exact", head: true }).eq("user_id", context.userId).in("status", ["pending", "received"]);
    return { spent, activeNumbers: activeNumbers ?? 0 };
  });
