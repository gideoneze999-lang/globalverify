import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ───────────── Product Orders ─────────────

export const listMyProductOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("product_orders")
      .select("id, amount_ngn, access_link, tracking_code, status, created_at, product:products(id,title,asset_url,category)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminListProductOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await supabaseAdmin
      .from("product_orders")
      .select("id, user_id, amount_ngn, access_link, tracking_code, status, created_at, product:products(id,title)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ───────────── Gift Orders ─────────────

export const createGiftOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      product_id: z.string().uuid(),
      recipient_name: z.string().min(1).max(120),
      recipient_email: z.string().email().max(200).optional().nullable(),
      recipient_phone: z.string().max(40).optional().nullable(),
      message: z.string().max(1000).optional().nullable(),
      delivery_tier: z.enum(["same_day", "next_day", "within_week"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: product, error: pErr } = await supabaseAdmin
      .from("products").select("id,title,price_ngn").eq("id", data.product_id).single();
    if (pErr || !product) throw new Error("Gift not found");

    const amount = Number(product.price_ngn);

    const { data: profile } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", userId).single();
    const bal = Number(profile?.wallet_balance ?? 0);
    if (bal < amount) throw new Error("Insufficient wallet balance — please fund your wallet");

    await supabaseAdmin.from("profiles").update({ wallet_balance: bal - amount }).eq("id", userId);

    const { data: order, error } = await supabaseAdmin.from("gift_orders").insert({
      user_id: userId,
      product_id: data.product_id,
      recipient_name: data.recipient_name,
      recipient_email: data.recipient_email ?? null,
      recipient_phone: data.recipient_phone ?? null,
      message: data.message ?? null,
      delivery_tier: data.delivery_tier,
      amount_ngn: amount,
      status: "pending",
    }).select().single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("transactions").insert({
      user_id: userId, type: "purchase", amount: -amount,
      description: `Gift order — ${product.title} → ${data.recipient_name}`,
      meta: { gift_order_id: order.id, tracking_code: order.tracking_code, tier: data.delivery_tier },
    });

    return order;
  });

export const listMyGiftOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("gift_orders")
      .select("*, product:products(id,title,asset_url)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminListGiftOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await supabaseAdmin
      .from("gift_orders")
      .select("*, product:products(id,title)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateGiftOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "processing", "processed", "delivered"]).optional(),
      admin_note: z.string().max(1000).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.admin_note !== undefined) patch.admin_note = data.admin_note;
    const { data: row, error } = await supabaseAdmin
      .from("gift_orders").update(patch).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return row;
  });
