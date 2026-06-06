## Bulk SMS page (`/dashboard/bulk-sms`)

Top tabs: **Single Messaging** | **Bulk Messaging**.

Shared fields:
- **Country** dropdown (ISO list with flags). On change, fetch active Twilio numbers for that country from `twilio_numbers` and show a **Sender Number** dropdown (only numbers actually present in our pool for that country are shown; if none, show "No number available for this country yet").
- **Sender ID** text input (alphanumeric, max 11 chars) — sent as Twilio `From` alphanumeric sender where supported; falls back to the chosen Twilio number where alphanumeric IDs aren't allowed (US/Canada). Tooltip explains this.
- **Message** textarea with live char + segment counter.

Mode-specific:
- Single: one **Recipient phone** input (E.164).
- Bulk: textarea + CSV upload; live recipient count.

Live cost panel: `price_per_sms × recipients × segments`, pulled from `app_settings.messaging_pricing.sms_per_segment_ngn`. Disabled "Send" until wallet ≥ cost. Success toast + redirect to job in Recent Jobs.

## Admin pricing page (`/admin/twilio`)

Already exists — add a clearer **"Price per SMS (₦)"** field (rename from "per segment" in UI; underlying field stays `sms_per_segment_ngn`) plus a small note that bulk total = price × recipients.

## Server changes (`messaging.functions.ts`)

- Extend `sendBulkSms` validator to accept `sender_id?: string` and `from_number_id?: string` (chosen Twilio number id).
- New `listTwilioNumbersByCountry(countryIso2)` server fn (authenticated, no admin) returning `{id, phone_e164, label}` for active numbers in that country only.
- In send loop: if `sender_id` is set and recipient country allows alphanumeric senders (maintain a small allowlist constant), use it as `From`; otherwise use the selected number's E.164.
- Keep existing wallet debit + per-failure refund logic.

## Voice Call page (`/dashboard/voice-call`)

Layout:
1. **Country** dropdown → **Twilio number** dropdown (same pattern as SMS, sourced from `twilio_numbers`).
2. **Recipient phone** (E.164).
3. **Voice sample upload** — accepts audio/video (`audio/*,video/*`), max 25 MB, stored in a new private bucket `voice-samples`. We extract audio server-side later; for now store as-is.
4. **Ownership checkbox** (required): "I confirm I own this voice or have explicit permission to use it." Submit disabled until checked.
5. **Per-minute rate** banner showing `app_settings.messaging_pricing.voice_per_minute_ngn` (new field, default ₦4,000). Min 1-minute charge displayed; wallet must cover at least 1 minute.
6. **Start Call** button.

## Voice backend — honest scope

True realtime voice-to-voice over an active Twilio call requires Twilio Media Streams (WebSocket bidirectional audio) bridged to ElevenLabs' realtime voice-changer stream. Cloudflare Workers (our server runtime) can't reliably host the long-lived dual WebSocket bridge this needs. Two options for the plan:

- **Option A — ship now, realistic**: User uploads voice sample + types/uploads a script. We clone the voice with ElevenLabs TTS (Instant Voice Clone), synthesize the full message to MP3, host it, and Twilio plays it via `<Play>` during the call. Per-minute billing measured from Twilio's call duration webhook. Works end-to-end on our stack.
- **Option B — realtime spoof**: Requires a separate always-on Node service (e.g. Fly.io/Render) running the Twilio↔ElevenLabs WebSocket bridge. We'd build the frontend + DB now and stub the backend; live calls only work after that external service is deployed.

I recommend Option A for v1 and adding Option B as a follow-up once a bridge host is chosen. Tell me which you want before I build.

## Database

New migration:
- `app_settings.messaging_pricing` → add `voice_per_minute_ngn` (default 4000), keep `sms_per_segment_ngn` (renamed in UI to "price per SMS").
- `voice_calls`: add `voice_sample_url`, `duration_seconds`, `cost_per_minute_ngn`, `ownership_confirmed_at`.
- New bucket `voice-samples` (private) + RLS: users read/write only their own folder `{user_id}/...`.

## Files touched

- `src/routes/dashboard.bulk-sms.tsx` — full rewrite with tabs + pickers.
- `src/routes/dashboard.voice-call.tsx` — full rewrite with upload + ownership + rate.
- `src/routes/admin.twilio.tsx` — add voice/min field, relabel SMS field.
- `src/lib/messaging.functions.ts` — add `listTwilioNumbersByCountry`, extend send/call fns.
- `supabase/migrations/<new>.sql` — schema + bucket + RLS additions.

**One decision needed**: Option A (clone + play prerecorded synthesized audio, ships fully) or Option B (realtime spoofing, requires external bridge host)?