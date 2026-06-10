import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// Countries where Twilio supports alphanumeric Sender IDs.
// (US, Canada and a few others do NOT — message there falls back to phone number.)
const ALPHA_SENDER_COUNTRIES = new Set([
  "GB","IE","DE","FR","ES","IT","NL","BE","CH","AT","SE","NO","DK","FI","PT",
  "PL","CZ","HU","RO","GR","TR","NG","KE","GH","ZA","IN","ID","MY","SG","TH",
  "PH","VN","AE","SA","IL","BR","AR","CL","CO","MX","AU","NZ","JP","KR","HK","TW",
]);

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
    voice_per_minute_ngn: Number(v.voice_per_minute_ngn ?? 4000),
  };
}

function smsSegments(msg: string): number {
  const isUnicode = /[^\u0000-\u007F]/.test(msg);
  const limit = isUnicode ? 70 : 160;
  const multi = isUnicode ? 67 : 153;
  return msg.length <= limit ? 1 : Math.ceil(msg.length / multi);
}

async function twilioRequest(path: string, body: URLSearchParams) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio is not configured. Admin must set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}${path}`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(json?.message || `Twilio error ${res.status}`);
  return json;
}

// ---------- Twilio numbers (user-visible) ----------
export const listTwilioCountries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data } = await supabaseAdmin.from("twilio_numbers")
      .select("country_iso2").eq("active", true);
    const set = new Set<string>((data ?? []).map((r: any) => r.country_iso2.toUpperCase()));
    return Array.from(set).sort();
  });

export const listTwilioNumbersByCountry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ country_iso2: z.string().length(2) }).parse(d))
  .handler(async ({ data }) => {
    const { data: rows } = await supabaseAdmin.from("twilio_numbers")
      .select("id, phone_e164, label, country_iso2")
      .eq("active", true).eq("country_iso2", data.country_iso2.toUpperCase());
    return rows ?? [];
  });

export const listAllAvailableTwilioNumbers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data: rows } = await supabaseAdmin.from("twilio_numbers")
      .select("id, phone_e164, label, country_iso2")
      .eq("active", true);
    return rows ?? [];
  });

// ---------- Bulk SMS ----------
export const sendBulkSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      message: z.string().min(1).max(1600),
      recipients: z.array(z.string().min(4).max(20)).min(1).max(1000),
      from_number_id: z.string().uuid(),
      sender_id: z.string().trim().max(11).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const pricing = await getPricing();
    const segments = smsSegments(data.message);

    const { data: senderRow } = await supabaseAdmin.from("twilio_numbers")
      .select("*").eq("id", data.from_number_id).eq("active", true).single();
    if (!senderRow) throw new Error("Selected sender number is not available");

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

    const wantsAlpha = !!data.sender_id && /^[A-Za-z0-9 ]{1,11}$/.test(data.sender_id);

    const siteUrl = (process.env.PUBLIC_SITE_URL || "https://globalverify.lovable.app").replace(/\/$/, "");
    const statusCallback = `${siteUrl}/api/public/twilio-status`;

    let sent = 0, failed = 0;
    for (const r of unique) {
      const canAlpha = wantsAlpha && r.country && ALPHA_SENDER_COUNTRIES.has(r.country);
      const fromValue = canAlpha ? data.sender_id! : senderRow.phone_e164;
      try {
        const body = new URLSearchParams({
          To: r.e164, From: fromValue, Body: data.message,
          StatusCallback: statusCallback,
        });
        const res = await twilioRequest("/Messages.json", body);
        await supabaseAdmin.from("bulk_sms_recipients").insert({
          job_id: job.id, to_phone: r.e164, country_iso2: r.country,
          from_phone: fromValue, twilio_sid: res.sid, status: "sent", cost_ngn: perRecipientCost,
        });
        sent++;
      } catch (e: any) {
        await supabaseAdmin.from("bulk_sms_recipients").insert({
          job_id: job.id, to_phone: r.e164, country_iso2: r.country,
          from_phone: fromValue, status: "failed", error: e.message, cost_ngn: 0,
        });
        failed++;
      }
    }


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

export const listJobRecipients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ job_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("bulk_sms_recipients")
      .select("id, to_phone, from_phone, status, error, delivered_at, created_at, twilio_sid")
      .eq("job_id", data.job_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });


// ---------- Voice clone + call ----------
// Estimate spoken seconds from script chars (English ~14 chars/sec).
function estimateDurationSeconds(script: string): number {
  return Math.max(5, Math.ceil(script.length / 14));
}

async function elevenLabsCloneVoice(name: string, sampleBytes: ArrayBuffer, filename: string): Promise<string> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ElevenLabs is not configured yet. Admin must add ELEVENLABS_API_KEY.");
  const fd = new FormData();
  fd.append("name", name);
  fd.append("files", new Blob([sampleBytes]), filename);
  const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST", headers: { "xi-api-key": key }, body: fd,
  });
  const j: any = await res.json();
  if (!res.ok) throw new Error(j?.detail?.message || j?.message || `ElevenLabs clone failed (${res.status})`);
  return j.voice_id as string;
}

async function elevenLabsTts(voiceId: string, text: string): Promise<ArrayBuffer> {
  const key = process.env.ELEVENLABS_API_KEY!;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `ElevenLabs TTS failed (${res.status})`);
  }
  return res.arrayBuffer();
}

async function elevenLabsDeleteVoice(voiceId: string) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return;
  await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
    method: "DELETE", headers: { "xi-api-key": key },
  }).catch(() => {});
}

export const placeVoiceCloneCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      to: z.string().min(4).max(20),
      script: z.string().min(1).max(1500),
      from_number_id: z.string().uuid(),
      voice_sample_path: z.string().min(1),
      ownership_confirmed: z.literal(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const pricing = await getPricing();
    const p = parsePhoneNumberFromString(data.to.trim().startsWith("+") ? data.to.trim() : `+${data.to.trim()}`);
    if (!p || !p.isValid()) throw new Error("Invalid phone number");

    const { data: sender } = await supabaseAdmin.from("twilio_numbers")
      .select("*").eq("id", data.from_number_id).eq("active", true).single();
    if (!sender) throw new Error("Selected sender number is not available");

    // Wallet pre-charge based on estimated duration
    const estSeconds = estimateDurationSeconds(data.script);
    const estMinutes = Math.max(1, Math.ceil(estSeconds / 60));
    const estCost = estMinutes * pricing.voice_per_minute_ngn;
    const { data: profile } = await supabaseAdmin.from("profiles")
      .select("wallet_balance").eq("id", context.userId).single();
    const bal = Number(profile?.wallet_balance ?? 0);
    if (bal < estCost) throw new Error(`Insufficient wallet. Need ₦${estCost.toLocaleString()} (est. ${estMinutes} min × ₦${pricing.voice_per_minute_ngn.toLocaleString()})`);
    await supabaseAdmin.from("profiles").update({ wallet_balance: bal - estCost }).eq("id", context.userId);

    // Insert pending call row
    const { data: callRow, error: callErr } = await supabaseAdmin.from("voice_calls").insert({
      user_id: context.userId,
      to_phone: p.number,
      from_phone: sender.phone_e164,
      message: data.script,
      script: data.script,
      voice_sample_url: data.voice_sample_path,
      cost_per_minute_ngn: pricing.voice_per_minute_ngn,
      cost_ngn: estCost,
      status: "preparing",
      ownership_confirmed_at: new Date().toISOString(),
    }).select().single();
    if (callErr || !callRow) throw new Error(callErr?.message || "Failed to create call");

    let voiceId: string | undefined;
    try {
      // 1) Download voice sample from private bucket
      const { data: dl, error: dlErr } = await supabaseAdmin.storage
        .from("voice-samples").download(data.voice_sample_path);
      if (dlErr || !dl) throw new Error(dlErr?.message || "Voice sample not found");
      const sampleBytes = await dl.arrayBuffer();

      // 2) Clone voice on ElevenLabs (ephemeral)
      voiceId = await elevenLabsCloneVoice(`call-${callRow.id}`, sampleBytes, "sample.mp3");

      // 3) Synthesize script
      const mp3 = await elevenLabsTts(voiceId, data.script);

      // 4) Upload synthesized MP3 to public bucket so Twilio can fetch it
      const ttsPath = `voice-tts/${callRow.id}.mp3`;
      const { error: upErr } = await supabaseAdmin.storage.from("products")
        .upload(ttsPath, new Blob([mp3], { type: "audio/mpeg" }), {
          contentType: "audio/mpeg", upsert: true,
        });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabaseAdmin.storage.from("products").getPublicUrl(ttsPath);
      const mp3Url = pub.publicUrl;

      // 5) Trigger Twilio call playing the MP3
      const twiml = `<Response><Play>${mp3Url}</Play></Response>`;
      const body = new URLSearchParams({ To: p.number, From: sender.phone_e164, Twiml: twiml });
      const res = await twilioRequest("/Calls.json", body);

      await supabaseAdmin.from("voice_calls").update({
        twilio_sid: res.sid,
        status: res.status ?? "queued",
      }).eq("id", callRow.id);

      await supabaseAdmin.from("transactions").insert({
        user_id: context.userId, type: "purchase", amount: estCost,
        description: `Voice clone call to ${p.number} (~${estMinutes} min)`,
        meta: { call_id: callRow.id, twilio_sid: res.sid, est_seconds: estSeconds },
      });

      // Best-effort cleanup of ephemeral cloned voice
      elevenLabsDeleteVoice(voiceId).catch(() => {});
      return { ok: true, sid: res.sid, callId: callRow.id, est_minutes: estMinutes, cost: estCost };
    } catch (e: any) {
      // Refund and mark failed
      await supabaseAdmin.from("profiles").update({ wallet_balance: bal }).eq("id", context.userId);
      await supabaseAdmin.from("voice_calls").update({
        status: "failed", error: e.message, cost_ngn: 0,
      }).eq("id", callRow.id);
      if (voiceId) elevenLabsDeleteVoice(voiceId).catch(() => {});
      throw new Error(e.message);
    }
  });

export const uploadVoiceSampleUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    filename: z.string().min(1).max(120),
    content_type: z.string().min(1).max(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${context.userId}/${Date.now()}-${safeName}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("voice-samples").createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message || "Failed to create upload URL");
    return { path, token: signed.token, signedUrl: signed.signedUrl };
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

// ---------- Twilio Phone Number Purchasing ----------
export const searchAvailableTwilioNumbers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      country_iso2: z.string().length(2),
      areaCode: z.string().optional(),
      limit: z.number().min(1).max(30).default(10),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const params = new URLSearchParams({
      Limit: data.limit.toString(),
    });
    if (data.areaCode) params.append("AreaCode", data.areaCode);

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("Twilio is not configured");

    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/AvailablePhoneNumbers/${data.country_iso2.toUpperCase()}/Local.json?${params.toString()}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const json: any = await res.json();
    if (!res.ok) throw new Error(json?.message || `Twilio error ${res.status}`);
    
    return (json.available_phone_numbers || []).map((n: any) => ({
      friendly_name: n.friendly_name,
      phone_number: n.phone_number,
      iso_country: n.iso_country,
      capabilities: n.capabilities,
    }));
  });

export const fetchTwilioSupportedCountries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("Twilio is not configured. Admin must set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");

    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    // Verify credentials first by calling account info
    const verifyRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    if (!verifyRes.ok) {
      const json: any = await verifyRes.json();
      throw new Error(`Twilio authentication failed: ${json.message || verifyRes.status}`);
    }

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/AvailablePhoneNumbers.json`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const json: any = await res.json();
    if (!res.ok) throw new Error(json?.message || `Twilio error ${res.status}`);
    
    return (json.countries || []).map((c: any) => ({
      iso2: c.country_code,
      name: c.country,
    }));
  });

export const provisionTwilioNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => 
    z.object({ 
      phone_number: z.string(), 
      iso_country: z.string().length(2) 
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("Twilio is not configured");

    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    
    // 1. Purchase the number in Twilio
    const purchaseRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json`,
      {
        method: "POST",
        headers: { 
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ PhoneNumber: data.phone_number })
      }
    );
    
    const purchaseJson: any = await purchaseRes.json();
    if (!purchaseRes.ok) throw new Error(purchaseJson.message || "Failed to purchase number in Twilio");

    // 2. Add to our local database pool
    const { data: row, error } = await supabaseAdmin.from("twilio_numbers").insert({
      phone_e164: purchaseJson.phone_number,
      country_iso2: data.iso_country.toUpperCase(),
      label: `Provisioned ${data.iso_country}`,
      active: true,
    } as any).select().single();


    if (error) {
      console.error("Local DB sync error after Twilio purchase:", error);
      // We don't throw here because the Twilio purchase was successful, 
      // but we should notify the user or try to reconcile.
    }

    return { ok: true, phone: purchaseJson.phone_number };
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
      voice_per_call_ngn: z.number().min(0).max(100000).optional(),
      voice_per_minute_ngn: z.number().min(0).max(1000000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const value = {
      sms_per_segment_ngn: data.sms_per_segment_ngn,
      voice_per_call_ngn: data.voice_per_call_ngn ?? data.voice_per_minute_ngn,
      voice_per_minute_ngn: data.voice_per_minute_ngn,
    };
    const { error } = await supabaseAdmin.from("app_settings").upsert({
      key: "messaging_pricing", value: value as any, updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
