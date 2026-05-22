import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (error) { console.error("checkIsAdmin error:", error); return { isAdmin: false }; }
    return { isAdmin: !!data };
  });

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await supabaseAdmin
      .from("profiles").select("id,first_name,last_name,phone,wallet_balance,updated_at,created_at")
      .order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adjustBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      user_id: z.string().uuid(),
      delta: z.number().refine((n) => n !== 0, "Amount required"),
      note: z.string().max(200).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: p } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", data.user_id).single();
    const newBal = Number(p?.wallet_balance ?? 0) + data.delta;
    if (newBal < 0) throw new Error("Insufficient balance for negative adjustment");
    await supabaseAdmin.from("profiles").update({ wallet_balance: newBal }).eq("id", data.user_id);
    await supabaseAdmin.from("transactions").insert({
      user_id: data.user_id, type: "adjustment", amount: data.delta,
      description: data.note ?? "Admin balance adjustment",
    });
    return { newBalance: newBal };
  });
