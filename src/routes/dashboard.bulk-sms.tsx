import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  sendBulkSms, listMyBulkJobs, listJobRecipients,
  listTwilioCountries, listAllAvailableTwilioNumbers,
  getMessagingPricing,
} from "@/lib/messaging.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageSquare, Send, Upload, ChevronDown, ChevronRight, RefreshCw, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [countryOpen, setCountryOpen] = useState(false);
  const [numberId, setNumberId] = useState<string>("");
  const [senderId, setSenderId] = useState("");
  const [singleTo, setSingleTo] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [message, setMessage] = useState("");

  const qc = useQueryClient();
  const sendFn = useServerFn(sendBulkSms);
  const listFn = useServerFn(listMyBulkJobs);
  const countriesFn = useServerFn(listTwilioCountries);
  const numbersFn = useServerFn(listAllAvailableTwilioNumbers);
  const pricingFn = useServerFn(getMessagingPricing);

  const { data: jobs } = useQuery({ queryKey: ["bulkJobs"], queryFn: () => listFn() });
  const { data: availableCountries } = useQuery({ queryKey: ["twilioCountries"], queryFn: () => countriesFn() });
  const { data: pricing } = useQuery({ queryKey: ["msgPricing"], queryFn: () => pricingFn() });
  const { data: numbers } = useQuery({
    queryKey: ["twilioNumbers"],
    queryFn: () => numbersFn(),
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

  const countriesShown = COUNTRIES;
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
              <Select value={numberId} onValueChange={setNumberId}>
                <SelectTrigger><SelectValue placeholder="Select sender number" /></SelectTrigger>
                <SelectContent>
                  {(numbers ?? []).map((n: any) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.phone_e164}{n.label ? ` — ${n.label}` : ""} ({n.country_iso2})
                    </SelectItem>
                  ))}
                  {(numbers ?? []).length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No active sender numbers available.
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent jobs</h2>
          <Button
            variant="ghost" size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ["bulkJobs"] })}
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
        <div className="space-y-2">
          {(jobs ?? []).map((j: any) => (
            <JobRow key={j.id} job={j} />
          ))}
          {(!jobs || jobs.length === 0) && <p className="text-sm text-muted-foreground">No jobs yet.</p>}
        </div>
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, { variant: any; label: string }> = {
    delivered: { variant: "default", label: "Delivered" },
    sent: { variant: "secondary", label: "Sent" },
    failed: { variant: "destructive", label: "Failed" },
    pending: { variant: "outline", label: "Pending" },
  };
  const s = map[status] ?? { variant: "outline", label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function JobRow({ job }: { job: any }) {
  const [open, setOpen] = useState(false);
  const listFn = useServerFn(listJobRecipients);
  const qc = useQueryClient();
  const { data: recipients, isFetching } = useQuery({
    queryKey: ["jobRecipients", job.id],
    queryFn: () => listFn({ data: { job_id: job.id } }),
    enabled: open,
    refetchInterval: open ? 5000 : false,
  });

  const delivered = job.delivered_count ?? 0;
  const sent = job.sent_count ?? 0;
  const failed = job.failed_count ?? 0;
  const total = job.total_recipients ?? 0;

  return (
    <div className="border-b border-border/30 pb-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-sm text-left hover:bg-muted/20 rounded-md px-2 py-1.5"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
          <div className="min-w-0">
            <div className="font-medium truncate max-w-[260px]">{job.message}</div>
            <div className="text-xs text-muted-foreground">{new Date(job.created_at).toLocaleString()}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex gap-1.5 justify-end">
            <Badge variant="default">{delivered} delivered</Badge>
            <Badge variant="secondary">{sent} sent</Badge>
            {failed > 0 && <Badge variant="destructive">{failed} failed</Badge>}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {total} total · ₦{Number(job.total_cost_ngn).toLocaleString()} · {job.status}
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-2 ml-6 rounded-lg border border-border/40 bg-muted/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
            <span>Recipient status {isFetching ? "(refreshing…)" : ""}</span>
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => qc.invalidateQueries({ queryKey: ["jobRecipients", job.id] })}
            >
              <RefreshCw className="w-3 h-3 inline mr-1" />Refresh
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-border/30">
            {(recipients ?? []).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="font-mono text-xs">{r.to_phone}</div>
                  {r.error && <div className="text-xs text-destructive truncate max-w-[260px]">{r.error}</div>}
                  {r.delivered_at && (
                    <div className="text-xs text-muted-foreground">
                      Delivered {new Date(r.delivered_at).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                {statusBadge(r.status)}
              </div>
            ))}
            {recipients && recipients.length === 0 && (
              <div className="px-3 py-3 text-xs text-muted-foreground">No recipients.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
