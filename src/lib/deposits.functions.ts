import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const createDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      amount: z.number().positive().max(10_000_000),
      screenshot_url: z.string().url().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("deposits")
      .insert({ user_id: context.userId, amount: data.amount, screenshot_url: data.screenshot_url ?? null })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMyDeposits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("deposits").select("*").eq("user_id", context.userId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAllDeposits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: deposits, error } = await supabaseAdmin
      .from("deposits").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    const userIds = Array.from(new Set((deposits ?? []).map((d) => d.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles").select("id,first_name,last_name,phone").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (deposits ?? []).map((d) => ({ ...d, profile: pmap.get(d.user_id) ?? null }));
  });

export const getReceiptSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ path: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: signed, error } = await supabaseAdmin.storage.from("receipts").createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const decideDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      decision: z.enum(["approved", "rejected"]),
      note: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: dep, error: fetchErr } = await supabaseAdmin.from("deposits").select("*").eq("id", data.id).single();
    if (fetchErr || !dep) throw new Error("Deposit not found");
    if (dep.status !== "pending") throw new Error("Already decided");

    const { error: updErr } = await supabaseAdmin
      .from("deposits")
      .update({ status: data.decision, admin_note: data.note ?? null })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    if (data.decision === "approved") {
      const { data: profile } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", dep.user_id).single();
      const newBal = Number(profile?.wallet_balance ?? 0) + Number(dep.amount);
      await supabaseAdmin.from("profiles").update({ wallet_balance: newBal }).eq("id", dep.user_id);
      await supabaseAdmin.from("transactions").insert({
        user_id: dep.user_id, type: "deposit", amount: Number(dep.amount),
        description: "Wallet funding approved", meta: { deposit_id: dep.id },
      });
    }
    return { ok: true };
  });
