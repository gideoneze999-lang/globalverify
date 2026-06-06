import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTwilioNumbers, addTwilioNumber, toggleTwilioNumber, deleteTwilioNumber, getMessagingPricing, updateMessagingPricing } from "@/lib/messaging.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Phone } from "lucide-react";

export const Route = createFileRoute("/admin/twilio")({
  head: () => ({ meta: [{ title: "Twilio — Admin" }] }),
  component: TwilioPage,
});

function TwilioPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTwilioNumbers);
  const addFn = useServerFn(addTwilioNumber);
  const togFn = useServerFn(toggleTwilioNumber);
  const delFn = useServerFn(deleteTwilioNumber);
  const getPriceFn = useServerFn(getMessagingPricing);
  const setPriceFn = useServerFn(updateMessagingPricing);

  const { data: numbers } = useQuery({ queryKey: ["twilioNumbers"], queryFn: () => listFn() });
  const { data: pricing } = useQuery({ queryKey: ["msgPricing"], queryFn: () => getPriceFn() });

  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [label, setLabel] = useState("");
  const [sms, setSms] = useState(25);
  const [voicePerMin, setVoicePerMin] = useState(4000);

  useEffect(() => {
    if (pricing) {
      setSms(pricing.sms_per_segment_ngn);
      setVoicePerMin((pricing as any).voice_per_minute_ngn ?? 4000);
    }
  }, [pricing]);

  const addM = useMutation({
    mutationFn: () => addFn({ data: { phone_e164: phone, country_iso2: country, label } }),
    onSuccess: () => { toast.success("Added"); setPhone(""); setCountry(""); setLabel(""); qc.invalidateQueries({ queryKey: ["twilioNumbers"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const savePricing = useMutation({
    mutationFn: () => setPriceFn({ data: { sms_per_segment_ngn: sms, voice_per_minute_ngn: voicePerMin } }),
    onSuccess: () => { toast.success("Pricing updated"); qc.invalidateQueries({ queryKey: ["msgPricing"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient flex items-center gap-2"><Phone className="w-7 h-7" /> Twilio</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage sender number pool and messaging pricing.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Messaging pricing (NGN)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Price per SMS</label>
            <Input type="number" value={sms} onChange={(e) => setSms(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">Bulk total = price × recipients × segments.</p>
          </div>
          <div>
            <label className="text-sm">Voice call (per minute)</label>
            <Input type="number" value={voicePerMin} onChange={(e) => setVoicePerMin(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">Voice-clone calls charged per minute, min 1 min.</p>
          </div>
        </div>
        <Button onClick={() => savePricing.mutate()} disabled={savePricing.isPending}>Save pricing</Button>
      </div>


      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Add Twilio number</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Input placeholder="+14155552671" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="Country ISO2 (US)" maxLength={2} value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} />
          <Input placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <Button onClick={() => addM.mutate()} disabled={addM.isPending || !phone || country.length !== 2}>Add number</Button>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-3">Sender pool</h2>
        <div className="space-y-2">
          {(numbers ?? []).map((n: any) => (
            <div key={n.id} className="flex items-center justify-between text-sm border-b border-border/30 pb-2">
              <div>
                <div className="font-medium">{n.phone_e164} <span className="text-xs text-muted-foreground">({n.country_iso2})</span></div>
                <div className="text-xs text-muted-foreground">{n.label || "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={n.active ? "default" : "outline"} onClick={() => togFn({ data: { id: n.id, active: !n.active } }).then(() => qc.invalidateQueries({ queryKey: ["twilioNumbers"] }))}>
                  {n.active ? "Active" : "Inactive"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) delFn({ data: { id: n.id } }).then(() => qc.invalidateQueries({ queryKey: ["twilioNumbers"] })); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {(!numbers || numbers.length === 0) && <p className="text-sm text-muted-foreground">No numbers added yet.</p>}
        </div>
      </div>
    </div>
  );
}
