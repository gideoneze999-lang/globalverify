import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Twilio sends application/x-www-form-urlencoded with MessageSid, MessageStatus, To, From, ErrorCode, ErrorMessage
// Signature: HMAC-SHA1 of (fullUrl + sorted concatenated key+value pairs), base64
function verifyTwilioSignature(url: string, params: Record<string, string>, signature: string, token: string) {
  const sorted = Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", token).update(url + sorted).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Map Twilio MessageStatus → our internal status
function mapStatus(s: string): string {
  switch (s) {
    case "delivered": return "delivered";
    case "failed":
    case "undelivered": return "failed";
    case "sent":
    case "sending":
    case "queued":
    case "accepted":
    case "scheduled": return "sent";
    default: return s;
  }
}

export const Route = createFileRoute("/api/public/twilio-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.TWILIO_AUTH_TOKEN;
        if (!token) return new Response("Not configured", { status: 500 });

        const bodyText = await request.text();
        const params: Record<string, string> = {};
        for (const [k, v] of new URLSearchParams(bodyText)) params[k] = v;

        const signature = request.headers.get("x-twilio-signature") ?? "";
        // Reconstruct the public URL Twilio called
        const url = new URL(request.url);
        const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
        const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
        const fullUrl = `${proto}://${host}${url.pathname}`;

        const ok = verifyTwilioSignature(fullUrl, params, signature, token);
        if (!ok) return new Response("Invalid signature", { status: 401 });

        const sid = params.MessageSid;
        const status = params.MessageStatus;
        if (!sid || !status) return new Response("Missing fields", { status: 400 });

        const mapped = mapStatus(status);
        const update: any = { status: mapped, updated_at: new Date().toISOString() };
        if (mapped === "delivered") update.delivered_at = new Date().toISOString();
        if (params.ErrorMessage) update.error = params.ErrorMessage;
        else if (params.ErrorCode) update.error = `Twilio error ${params.ErrorCode}`;

        const { data: rec } = await supabaseAdmin.from("bulk_sms_recipients")
          .update(update).eq("twilio_sid", sid).select("job_id").maybeSingle();

        if (rec?.job_id) {
          // Recompute job counters
          const { data: rows } = await supabaseAdmin.from("bulk_sms_recipients")
            .select("status").eq("job_id", rec.job_id);
          const delivered = (rows ?? []).filter((r: any) => r.status === "delivered").length;
          const failed = (rows ?? []).filter((r: any) => r.status === "failed").length;
          const sentOrBetter = (rows ?? []).filter((r: any) => r.status === "sent" || r.status === "delivered").length;
          await supabaseAdmin.from("bulk_sms_jobs").update({
            delivered_count: delivered,
            failed_count: failed,
            sent_count: sentOrBetter,
            updated_at: new Date().toISOString(),
          }).eq("id", rec.job_id);
        }

        return new Response("ok");
      },
    },
  },
});
