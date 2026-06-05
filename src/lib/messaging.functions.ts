import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { parsePhoneNumberFromString } from "libphonenumber-js";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

async function getPricing() {
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", "messaging_pricing").single();
  const v = (data?.value as any) ?? {};
  return {
    sms_per_segment_ngn: Number(v.sms_per_segment_ngn ?? 25),
    voice_per_call_ngn: Number(v.voice_per_call_ngn ?? 100),
  };
}

function smsSegments(msg: string): number {
  const isUnicode = /[^\u0000-\u007F]/.test(msg);
  const limit = isUnicode ? 70 : 160;
  const multi = isUnicode ? 67 : 153;
  return msg.length <= limit ? 1 : Math.ceil(msg.length / multi);
}

async function pickSender(countryIso2: string | null) {
  const { data: numbers } = await supabaseAdmin
    .from("twilio_numbers").select("*").eq("active", true);
  if (!numbers || numbers.length === 0) return null;
  if (countryIso2) {
    const same = numbers.find((n) => n.country_iso2.toUpperCase() === countryIso2.toUpperCase());
    if (same) return same;
  }
  return numbers[0];
}

async function twilioRequest(path: string, body: URLSearchParams) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio not configured");
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(json?.message || `Twilio error ${res.status}`);
  return json;
}

// ---------- Bulk SMS ----------
export const sendBulkSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      message: z.string().min(1).max(1600),
      recipients: z.array(z.string().min(4).max(20)).min(1).max(1000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const pricing = await getPricing();
    const segments = smsSegments(data.message);

    // Normalize & dedupe recipients
    const parsed = data.recipients.map((raw) => {
      const p = parsePhoneNumberFromString(raw.trim().startsWith("+") ? raw.trim() : `+${raw.trim()}`);
      return p && p.isValid() ? { e164: p.number, country: p.country ?? null } : null;
    }).filter(Boolean) as { e164: string; country: string | null }[];

    const seen = new Set<string>();
    const unique = parsed.filter((p) => (seen.has(p.e164) ? false : (seen.add(p.e164), true)));
    if (unique.length === 0) throw new Error("No valid phone numbers");

    const perRecipientCost = segments * pricing.sms_per_segment_ngn;
    const totalCost = perRecipientCost * unique.length;

    // Check & debit wallet
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("wallet_balance").eq("id", context.userId).single();
    const bal = Number(profile?.wallet_balance ?? 0);
    if (bal < totalCost) throw new Error(`Insufficient wallet. Need ₦${totalCost.toLocaleString()}, have ₦${bal.toLocaleString()}`);
    await supabaseAdmin.from("profiles").update({ wallet_balance: bal - totalCost }).eq("id", context.userId);

    const { data: job, error: jobErr } = await supabaseAdmin.from("bulk_sms_jobs").insert({
      user_id: context.userId,
      message: data.message,
      total_recipients: unique.length,
      total_cost_ngn: totalCost,
      status: "sending",
    }).select().single();
    if (jobErr || !job) throw new Error(jobErr?.message || "Failed to create job");

    let sent = 0, failed = 0;
    for (const r of unique) {
      const sender = await pickSender(r.country);
      if (!sender) {
        await supabaseAdmin.from("bulk_sms_recipients").insert({
          job_id: job.id, to_phone: r.e164, country_iso2: r.country, status: "failed",
          error: "No sender number configured", cost_ngn: 0,
        });
        failed++;
        continue;
      }
      try {
        const body = new URLSearchParams({ To: r.e164, From: sender.phone_e164, Body: data.message });
        const res = await twilioRequest("/Messages.json", body);
        await supabaseAdmin.from("bulk_sms_recipients").insert({
          job_id: job.id, to_phone: r.e164, country_iso2: r.country,
          from_phone: sender.phone_e164, twilio_sid: res.sid, status: "sent", cost_ngn: perRecipientCost,
        });
        sent++;
      } catch (e: any) {
        await supabaseAdmin.from("bulk_sms_recipients").insert({
          job_id: job.id, to_phone: r.e164, country_iso2: r.country,
          from_phone: sender.phone_e164, status: "failed", error: e.message, cost_ngn: 0,
        });
        failed++;
      }
    }

    // Refund failures
    const refund = failed * perRecipientCost;
    if (refund > 0) {
      const { data: p2 } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", context.userId).single();
      await supabaseAdmin.from("profiles").update({ wallet_balance: Number(p2?.wallet_balance ?? 0) + refund }).eq("id", context.userId);
    }

    const actualCost = sent * perRecipientCost;
    const status = sent === 0 ? "failed" : failed === 0 ? "completed" : "partial";
    await supabaseAdmin.from("bulk_sms_jobs").update({
      sent_count: sent, failed_count: failed, total_cost_ngn: actualCost, status,
    }).eq("id", job.id);

    await supabaseAdmin.from("transactions").insert({
      user_id: context.userId, type: "purchase", amount: actualCost,
      description: `Bulk SMS — ${sent} sent, ${failed} failed`,
      meta: { job_id: job.id, segments },
    });

    return { jobId: job.id, sent, failed, cost: actualCost };
  });

export const listMyBulkJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bulk_sms_jobs").select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- Voice ----------
export const placeCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      to: z.string().min(4).max(20),
      message: z.string().min(1).max(500),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const pricing = await getPricing();
    const p = parsePhoneNumberFromString(data.to.trim().startsWith("+") ? data.to.trim() : `+${data.to.trim()}`);
    if (!p || !p.isValid()) throw new Error("Invalid phone number");
    const sender = await pickSender(p.country ?? null);
    if (!sender) throw new Error("No Twilio number configured. Ask admin.");

    const { data: profile } = await supabaseAdmin
      .from("profiles").select("wallet_balance").eq("id", context.userId).single();
    const bal = Number(profile?.wallet_balance ?? 0);
    if (bal < pricing.voice_per_call_ngn) throw new Error(`Insufficient wallet. Need ₦${pricing.voice_per_call_ngn}`);
    await supabaseAdmin.from("profiles").update({ wallet_balance: bal - pricing.voice_per_call_ngn }).eq("id", context.userId);

    const twiml = `<Response><Say voice="alice">${data.message.replace(/[<>&]/g, "")}</Say></Response>`;
    try {
      const body = new URLSearchParams({ To: p.number, From: sender.phone_e164, Twiml: twiml });
      const res = await twilioRequest("/Calls.json", body);
      const { data: row } = await supabaseAdmin.from("voice_calls").insert({
        user_id: context.userId, to_phone: p.number, from_phone: sender.phone_e164,
        message: data.message, twilio_sid: res.sid, status: res.status ?? "queued",
        cost_ngn: pricing.voice_per_call_ngn,
      }).select().single();
      await supabaseAdmin.from("transactions").insert({
        user_id: context.userId, type: "purchase", amount: pricing.voice_per_call_ngn,
        description: `Voice call to ${p.number}`, meta: { call_id: row?.id, twilio_sid: res.sid },
      });
      return { ok: true, sid: res.sid };
    } catch (e: any) {
      // Refund
      await supabaseAdmin.from("profiles").update({ wallet_balance: bal }).eq("id", context.userId);
      await supabaseAdmin.from("voice_calls").insert({
        user_id: context.userId, to_phone: p.number, from_phone: sender.phone_e164,
        message: data.message, status: "failed", error: e.message, cost_ngn: 0,
      });
      throw new Error(e.message);
    }
  });

export const listMyCalls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("voice_calls").select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- Admin: Twilio number pool ----------
export const listTwilioNumbers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await supabaseAdmin.from("twilio_numbers").select("*").order("country_iso2");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addTwilioNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      phone_e164: z.string().regex(/^\+[1-9]\d{6,14}$/),
      country_iso2: z.string().length(2),
      label: z.string().max(100).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await supabaseAdmin.from("twilio_numbers").insert({
      phone_e164: data.phone_e164,
      country_iso2: data.country_iso2.toUpperCase(),
      label: data.label ?? null,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleTwilioNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await supabaseAdmin.from("twilio_numbers").update({ active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTwilioNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await supabaseAdmin.from("twilio_numbers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMessagingPricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => getPricing());

export const updateMessagingPricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      sms_per_segment_ngn: z.number().min(0).max(100000),
      voice_per_call_ngn: z.number().min(0).max(100000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await supabaseAdmin.from("app_settings").upsert({
      key: "messaging_pricing", value: data as any, updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
