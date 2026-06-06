import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  placeVoiceCloneCall, listMyCalls,
  listTwilioCountries, listTwilioNumbersByCountry,
  getMessagingPricing, uploadVoiceSampleUrl,
} from "@/lib/messaging.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PhoneCall, Upload, FileAudio } from "lucide-react";
import { COUNTRIES, findCountry } from "@/lib/countries";

export const Route = createFileRoute("/dashboard/voice-call")({
  head: () => ({ meta: [{ title: "Voice Call — GlobalVerify" }] }),
  component: VoiceCallPage,
});

function VoiceCallPage() {
  const [country, setCountry] = useState("");
  const [numberId, setNumberId] = useState("");
  const [to, setTo] = useState("");
  const [script, setScript] = useState("");
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [samplePath, setSamplePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ownership, setOwnership] = useState(false);

  const qc = useQueryClient();
  const callFn = useServerFn(placeVoiceCloneCall);
  const listFn = useServerFn(listMyCalls);
  const countriesFn = useServerFn(listTwilioCountries);
  const numbersFn = useServerFn(listTwilioNumbersByCountry);
  const pricingFn = useServerFn(getMessagingPricing);
  const signFn = useServerFn(uploadVoiceSampleUrl);

  const { data: calls } = useQuery({ queryKey: ["myCalls"], queryFn: () => listFn() });
  const { data: availableCountries } = useQuery({ queryKey: ["twilioCountries"], queryFn: () => countriesFn() });
  const { data: pricing } = useQuery({ queryKey: ["msgPricing"], queryFn: () => pricingFn() });
  const { data: numbers } = useQuery({
    queryKey: ["twilioNumbers", country],
    queryFn: () => numbersFn({ data: { country_iso2: country } }),
    enabled: !!country,
  });

  const perMinute = pricing?.voice_per_minute_ngn ?? 0;
  const estSeconds = useMemo(() => Math.max(5, Math.ceil(script.length / 14)), [script]);
  const estMinutes = Math.max(1, Math.ceil(estSeconds / 60));
  const estCost = estMinutes * perMinute;

  async function handleUploadSample() {
    if (!sampleFile) return;
    if (sampleFile.size > 25 * 1024 * 1024) { toast.error("File too large (max 25MB)"); return; }
    setUploading(true);
    try {
      const sig = await signFn({ data: { filename: sampleFile.name, content_type: sampleFile.type || "application/octet-stream" } });
      const up = await fetch(sig.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": sampleFile.type || "application/octet-stream" },
        body: sampleFile,
      });
      if (!up.ok) throw new Error(`Upload failed (${up.status})`);
      setSamplePath(sig.path);
      toast.success("Voice sample uploaded");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  const mutation = useMutation({
    mutationFn: () => callFn({
      data: {
        to,
        script,
        from_number_id: numberId,
        voice_sample_path: samplePath!,
        ownership_confirmed: true,
      },
    }),
    onSuccess: (r) => {
      toast.success(`Call placed (~${r.est_minutes} min, ₦${r.cost.toLocaleString()})`);
      setTo(""); setScript(""); setSampleFile(null); setSamplePath(null); setOwnership(false);
      qc.invalidateQueries({ queryKey: ["myCalls"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const availableSet = new Set(availableCountries ?? []);
  const countriesShown = COUNTRIES.filter((c) => availableSet.has(c.iso2));
  const ready = country && numberId && to && script && samplePath && ownership && !mutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient flex items-center gap-2">
          <PhoneCall className="w-7 h-7" /> Voice Call (Voice Cloning)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a voice sample, type what to say, and we'll call the recipient speaking in that cloned voice.
        </p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <div className="font-semibold">Per-minute rate: ₦{perMinute.toLocaleString()} / min</div>
        <div className="text-xs text-muted-foreground mt-1">
          Min 1 minute. Estimated for this script: <b>{estMinutes} min</b> · <b>₦{estCost.toLocaleString()}</b>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Country</label>
            <Select value={country} onValueChange={(v) => { setCountry(v); setNumberId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                {countriesShown.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No Twilio numbers configured.</div>
                )}
                {countriesShown.map((c) => (
                  <SelectItem key={c.iso2} value={c.iso2}>{c.flag} {c.name} ({c.dial})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Caller number (Twilio)</label>
            <Select value={numberId} onValueChange={setNumberId} disabled={!country}>
              <SelectTrigger><SelectValue placeholder={country ? "Select number" : "Pick country first"} /></SelectTrigger>
              <SelectContent>
                {(numbers ?? []).map((n: any) => (
                  <SelectItem key={n.id} value={n.id}>{n.phone_e164}{n.label ? ` — ${n.label}` : ""}</SelectItem>
                ))}
                {country && (numbers ?? []).length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No number for {findCountry(country)?.name} yet.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Recipient phone (E.164)</label>
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="+14155552671" />
        </div>

        <div>
          <label className="text-sm font-medium">Voice sample (audio or video, max 25MB)</label>
          <div className="flex items-center gap-2 mt-1">
            <label className="flex-1 cursor-pointer border border-dashed border-border rounded-lg p-3 text-sm flex items-center gap-2 hover:bg-muted/30">
              <FileAudio className="w-4 h-4" />
              <span className="truncate">{sampleFile?.name ?? "Choose audio/video file"}</span>
              <input
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={(e) => { setSampleFile(e.target.files?.[0] ?? null); setSamplePath(null); }}
              />
            </label>
            <Button type="button" variant="outline" onClick={handleUploadSample} disabled={!sampleFile || uploading || !!samplePath}>
              <Upload className="w-4 h-4 mr-1" /> {samplePath ? "Uploaded" : uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            30–60 seconds of clean speech works best. Stored privately, only used to clone the voice for this call.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Script (what the cloned voice will say)</label>
          <Textarea rows={5} value={script} onChange={(e) => setScript(e.target.value)} maxLength={1500}
            placeholder="Hi, this is a quick message…" />
          <div className="text-xs text-muted-foreground mt-1">{script.length} chars · est. {estSeconds}s</div>
        </div>

        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <Checkbox checked={ownership} onCheckedChange={(v) => setOwnership(!!v)} />
          <span>
            I confirm I own this voice <b>or</b> have explicit permission from the voice owner to clone and use it
            for this call. I take full responsibility for compliance with local laws.
          </span>
        </label>

        <Button onClick={() => mutation.mutate()} disabled={!ready} className="w-full sm:w-auto">
          <PhoneCall className="w-4 h-4 mr-2" />
          {mutation.isPending ? "Starting call…" : `Start Call (₦${estCost.toLocaleString()})`}
        </Button>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-3">Recent calls</h2>
        <div className="space-y-2">
          {(calls ?? []).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between text-sm border-b border-border/30 pb-2">
              <div>
                <div className="font-medium">{c.to_phone}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[260px]">{c.script ?? c.message}</div>
              </div>
              <div className="text-right text-xs">
                <div>{c.status}</div>
                <div className="text-muted-foreground">₦{Number(c.cost_ngn).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {(!calls || calls.length === 0) && <p className="text-sm text-muted-foreground">No calls yet.</p>}
        </div>
      </div>
    </div>
  );
}
