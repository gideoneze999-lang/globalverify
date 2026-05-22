import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE = "https://5sim.net/v1";

async function sim5(path: string, init?: RequestInit) {
  const key = process.env.SIM5_API_KEY;
  if (!key) throw new Error("5sim API key not configured");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`5sim error ${res.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return text; }
}

async function getPricing() {
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", "pricing").single();
  const v = (data?.value as any) ?? { markup_percent: 20, exchange_rate_ngn_per_usd: 1600 };
  return { markup: Number(v.markup_percent), rate: Number(v.exchange_rate_ngn_per_usd) };
}

function toNgn(usd: number, p: { markup: number; rate: number }) {
  return Math.round(usd * p.rate * (1 + p.markup / 100) * 100) / 100;
}

export const listCountries = createServerFn({ method: "GET" }).handler(async () => {
  const data = await sim5("/guest/countries");
  // shape: { russia: { text_en, prefix, ... } }
  const list = Object.entries(data as Record<string, any>).map(([code, v]) => ({
    code, name: v.text_en ?? code, prefix: Object.keys(v.prefix ?? {})[0] ?? "",
  }));
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
});

export const listServices = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ country: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const raw = await sim5(`/guest/products/${encodeURIComponent(data.country)}/any`);
    const p = await getPricing();
    return Object.entries(raw as Record<string, any>)
      .map(([service, v]) => ({
        service,
        category: v.Category ?? "activation",
        qty: v.Qty ?? 0,
        price_usd: Number(v.Price ?? 0),
        price_ngn: toNgn(Number(v.Price ?? 0), p),
      }))
      .filter((x) => x.qty > 0 && x.price_usd > 0)
      .sort((a, b) => a.service.localeCompare(b.service));
  });

export const buyNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      country: z.string().min(1).max(60),
      service: z.string().min(1).max(60),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // price lookup
    const raw = await sim5(`/guest/products/${encodeURIComponent(data.country)}/any`);
    const svc = (raw as any)[data.service];
    if (!svc || !svc.Price) throw new Error("Service unavailable");
    const p = await getPricing();
    const priceNgn = toNgn(Number(svc.Price), p);

    // wallet check + debit
    const { data: profile } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", context.userId).single();
    const bal = Number(profile?.wallet_balance ?? 0);
    if (bal < priceNgn) throw new Error("Insufficient wallet balance");

    // buy from 5sim
    const order: any = await sim5(`/user/buy/activation/${encodeURIComponent(data.country)}/any/${encodeURIComponent(data.service)}`);

    await supabaseAdmin.from("profiles").update({ wallet_balance: bal - priceNgn }).eq("id", context.userId);
    const { data: row, error } = await supabaseAdmin.from("number_orders").insert({
      user_id: context.userId,
      sim5_order_id: String(order.id),
      country: data.country,
      service: data.service,
      phone: order.phone,
      price_ngn: priceNgn,
      status: "pending",
      expires_at: order.expires ?? null,
    }).select().single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("transactions").insert({
      user_id: context.userId, type: "number", amount: -priceNgn,
      description: `Virtual number — ${data.service} (${data.country})`,
      meta: { order_id: row.id, phone: order.phone, sim5_order_id: String(order.id) },
    });
    return row;
  });

export const listMyNumbers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("number_orders").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const checkOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await supabaseAdmin.from("number_orders").select("*").eq("id", data.id).single();
    if (error || !row) throw new Error("Order not found");
    if (row.user_id !== context.userId) throw new Error("Forbidden");
    if (!row.sim5_order_id) return row;
    const result: any = await sim5(`/user/check/${row.sim5_order_id}`);
    const sms = result.sms ?? [];
    const status = (result.status ?? "PENDING").toLowerCase();
    const mapped = status.includes("receive") ? "received" : status.includes("cancel") ? "cancelled" : status.includes("finish") ? "finished" : status.includes("timeout") ? "timeout" : "pending";
    const { data: upd } = await supabaseAdmin.from("number_orders").update({ sms, status: mapped }).eq("id", row.id).select().single();
    return upd ?? row;
  });

export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await supabaseAdmin.from("number_orders").select("*").eq("id", data.id).single();
    if (error || !row) throw new Error("Order not found");
    if (row.user_id !== context.userId) throw new Error("Forbidden");
    if (row.status !== "pending") throw new Error("Cannot cancel");
    try { await sim5(`/user/cancel/${row.sim5_order_id}`); } catch { /* ignore */ }
    await supabaseAdmin.from("number_orders").update({ status: "cancelled" }).eq("id", row.id);
    // refund
    const { data: profile } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", context.userId).single();
    const newBal = Number(profile?.wallet_balance ?? 0) + Number(row.price_ngn);
    await supabaseAdmin.from("profiles").update({ wallet_balance: newBal }).eq("id", context.userId);
    await supabaseAdmin.from("transactions").insert({
      user_id: context.userId, type: "refund", amount: Number(row.price_ngn),
      description: `Refund — cancelled ${row.service} (${row.country})`,
      meta: { order_id: row.id },
    });
    return { ok: true };
  });
