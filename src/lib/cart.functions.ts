import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cart_items")
      .select("id, quantity, product:products(*)")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(99).default(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("cart_items").select("id,quantity").eq("user_id", context.userId).eq("product_id", data.product_id).maybeSingle();
    if (existing) {
      const { error } = await context.supabase.from("cart_items").update({ quantity: existing.quantity + data.quantity }).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("cart_items").insert({ user_id: context.userId, product_id: data.product_id, quantity: data.quantity });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const removeFromCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cart_items").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { data: items, error } = await supabaseAdmin
      .from("cart_items")
      .select("id, quantity, product:products(id,title,price_ngn,access_link)")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    if (!items || !items.length) throw new Error("Cart is empty");

    const total = items.reduce((s, it: any) => s + Number(it.product.price_ngn) * it.quantity, 0);
    const { data: profile } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", userId).single();
    const bal = Number(profile?.wallet_balance ?? 0);
    if (bal < total) throw new Error("Insufficient wallet balance");

    await supabaseAdmin.from("profiles").update({ wallet_balance: bal - total }).eq("id", userId);

    // Create one product_order per cart line, snapshotting the access link
    const orderRows = items.flatMap((it: any) =>
      Array.from({ length: it.quantity }).map(() => ({
        user_id: userId,
        product_id: it.product.id,
        amount_ngn: Number(it.product.price_ngn),
        access_link: it.product.access_link ?? null,
        status: "delivered" as const,
      })),
    );
    const { data: createdOrders } = await supabaseAdmin
      .from("product_orders").insert(orderRows).select("id, tracking_code, product_id, access_link");

    await supabaseAdmin.from("transactions").insert({
      user_id: userId, type: "purchase", amount: -total,
      description: `Marketplace purchase (${items.length} item${items.length > 1 ? "s" : ""})`,
      meta: {
        items: items.map((i: any) => ({ id: i.product.id, title: i.product.title, qty: i.quantity, price: i.product.price_ngn })),
        order_ids: createdOrders?.map((o) => o.id) ?? [],
      },
    });
    await supabaseAdmin.from("cart_items").delete().eq("user_id", userId);
    return { ok: true, total, orders: createdOrders ?? [] };
  });
