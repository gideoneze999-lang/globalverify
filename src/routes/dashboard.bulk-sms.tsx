import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  sendBulkSms, listMyBulkJobs,
  listTwilioCountries, listTwilioNumbersByCountry,
  getMessagingPricing,
} from "@/lib/messaging.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MessageSquare, Send, Upload } from "lucide-react";
import { COUNTRIES, findCountry } from "@/lib/countries";

export const Route = createFileRoute("/dashboard/bulk-sms")({
  head: () => ({ meta: [{ title: "Bulk SMS — GlobalVerify" }] }),
  component: BulkSmsPage,
});

function smsSegments(msg: string) {
  if (!msg) return 0;
  const isUnicode = /[^\u0000-\u007F]/.test(msg);
  const limit = isUnicode ? 70 : 160;
  const multi = isUnicode ? 67 : 153;
  return msg.length <= limit ? 1 : Math.ceil(msg.length / multi);
}

function BulkSmsPage() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [country, setCountry] = useState<string>("");
  const [numberId, setNumberId] = useState<string>("");
  const [senderId, setSenderId] = useState("");
  const [singleTo, setSingleTo] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [message, setMessage] = useState("");

  const qc = useQueryClient();
  const sendFn = useServerFn(sendBulkSms);
  const listFn = useServerFn(listMyBulkJobs);
  const countriesFn = useServerFn(listTwilioCountries);
  const numbersFn = useServerFn(listTwilioNumbersByCountry);
  const pricingFn = useServerFn(getMessagingPricing);

  const { data: jobs } = useQuery({ queryKey: ["bulkJobs"], queryFn: () => listFn() });
  const { data: availableCountries } = useQuery({ queryKey: ["twilioCountries"], queryFn: () => countriesFn() });
  const { data: pricing } = useQuery({ queryKey: ["msgPricing"], queryFn: () => pricingFn() });
  const { data: numbers } = useQuery({
    queryKey: ["twilioNumbers", country],
    queryFn: () => numbersFn({ data: { country_iso2: country } }),
    enabled: !!country,
  });

  const recipients = useMemo(() => {
    const raw = mode === "single" ? singleTo : bulkText;
    return raw.split(/[\n,;\s]+/).map((s) => s.trim()).filter(Boolean);
  }, [mode, singleTo, bulkText]);

  const segments = smsSegments(message);
  const pricePerSms = pricing?.sms_per_segment_ngn ?? 0;
  const totalCost = recipients.length * segments * pricePerSms;

  const mutation = useMutation({
    mutationFn: () => sendFn({
      data: {
        message,
        recipients,
        from_number_id: numberId,
        sender_id: senderId.trim() || undefined,
      },
    }),
    onSuccess: (r) => {
      toast.success(`Sent ${r.sent}, failed ${r.failed}. Charged ₦${r.cost.toLocaleString()}`);
      setSingleTo(""); setBulkText(""); setMessage("");
      qc.invalidateQueries({ queryKey: ["bulkJobs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const onCsvUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? "");
      const cleaned = text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).join("\n");
      setBulkText((prev) => (prev ? prev + "\n" : "") + cleaned);
    };
    reader.readAsText(file);
  };

  const availableSet = new Set(availableCountries ?? []);
  const countriesShown = COUNTRIES.filter((c) => availableSet.has(c.iso2));
  const disabled = !numberId || !message || recipients.length === 0 || mutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient flex items-center gap-2">
          <MessageSquare className="w-7 h-7" /> Bulk SMS
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send SMS worldwide. Pick a country and Twilio sender number, optionally set a custom Sender ID.
        </p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="grid grid-cols-2 w-full max-w-sm">
            <TabsTrigger value="single">Single Messaging</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Messaging</TabsTrigger>
          </TabsList>

          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="text-sm font-medium">Country</label>
              <Select value={country} onValueChange={(v) => { setCountry(v); setNumberId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {countriesShown.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No Twilio numbers configured. Ask admin.
                    </div>
                  )}
                  {countriesShown.map((c) => (
                    <SelectItem key={c.iso2} value={c.iso2}>
                      {c.flag} {c.name} ({c.dial})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Twilio sender number</label>
              <Select value={numberId} onValueChange={setNumberId} disabled={!country}>
                <SelectTrigger><SelectValue placeholder={country ? "Select number" : "Pick country first"} /></SelectTrigger>
                <SelectContent>
                  {(numbers ?? []).map((n: any) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.phone_e164}{n.label ? ` — ${n.label}` : ""}
                    </SelectItem>
                  ))}
                  {country && (numbers ?? []).length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No number available for {findCountry(country)?.name} yet.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Custom Sender ID (optional)</label>
              <Input
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                maxLength={11}
                placeholder="MyBrand"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Up to 11 chars (A–Z, 0–9). Some countries (US/Canada) ignore this and use the phone number.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">{mode === "single" ? "Recipient phone" : "Recipients"}</label>
              {mode === "single" ? (
                <Input
                  value={singleTo}
                  onChange={(e) => setSingleTo(e.target.value)}
                  placeholder="+14155552671"
                />
              ) : (
                <>
                  <Textarea
                    rows={5}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="+14155552671&#10;+2348012345678&#10;+447700900123"
                  />
                  <label className="inline-flex items-center gap-2 text-xs mt-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload CSV / TXT</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) onCsvUpload(f); e.target.value = ""; }}
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        </Tabs>

        <div>
          <label className="text-sm font-medium">Message</label>
          <Textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1600}
            placeholder="Your message…"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {message.length} chars · {segments} segment{segments === 1 ? "" : "s"}
          </div>
        </div>

        <div className="rounded-xl bg-muted/30 border border-border/40 p-4 grid sm:grid-cols-3 gap-3 text-sm">
          <div><div className="text-xs text-muted-foreground">Price / SMS</div><div className="font-semibold">₦{pricePerSms.toLocaleString()}</div></div>
          <div><div className="text-xs text-muted-foreground">Recipients</div><div className="font-semibold">{recipients.length}</div></div>
          <div><div className="text-xs text-muted-foreground">Estimated total</div><div className="font-semibold text-gradient">₦{totalCost.toLocaleString()}</div></div>
        </div>

        <Button onClick={() => mutation.mutate()} disabled={disabled} className="w-full sm:w-auto">
          <Send className="w-4 h-4 mr-2" /> {mutation.isPending ? "Sending…" : "Send"}
        </Button>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-3">Recent jobs</h2>
        <div className="space-y-2">
          {(jobs ?? []).map((j: any) => (
            <div key={j.id} className="flex items-center justify-between text-sm border-b border-border/30 pb-2">
              <div>
                <div className="font-medium truncate max-w-[300px]">{j.message}</div>
                <div className="text-xs text-muted-foreground">{new Date(j.created_at).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div>{j.sent_count}/{j.total_recipients} sent</div>
                <div className="text-xs text-muted-foreground">₦{Number(j.total_cost_ngn).toLocaleString()} · {j.status}</div>
              </div>
            </div>
          ))}
          {(!jobs || jobs.length === 0) && <p className="text-sm text-muted-foreground">No jobs yet.</p>}
        </div>
      </div>
    </div>
  );
}
