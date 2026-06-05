import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { placeCall, listMyCalls } from "@/lib/messaging.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PhoneCall } from "lucide-react";

export const Route = createFileRoute("/dashboard/voice-call")({
  head: () => ({ meta: [{ title: "Voice Call — GlobalVerify" }] }),
  component: VoiceCallPage,
});

function VoiceCallPage() {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const qc = useQueryClient();
  const callFn = useServerFn(placeCall);
  const listFn = useServerFn(listMyCalls);

  const { data: calls } = useQuery({ queryKey: ["myCalls"], queryFn: () => listFn() });

  const mutation = useMutation({
    mutationFn: () => callFn({ data: { to, message } }),
    onSuccess: () => {
      toast.success("Call placed");
      setTo(""); setMessage("");
      qc.invalidateQueries({ queryKey: ["myCalls"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient flex items-center gap-2"><PhoneCall className="w-7 h-7" /> Voice Call</h1>
        <p className="text-sm text-muted-foreground mt-1">Send an automated voice message to any number worldwide.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Recipient phone (E.164)</label>
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="+14155552671" />
        </div>
        <div>
          <label className="text-sm font-medium">Voice message</label>
          <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="What should we read out loud?" />
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !to || !message}>
          <PhoneCall className="w-4 h-4 mr-2" /> {mutation.isPending ? "Calling…" : "Place call"}
        </Button>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-3">Recent calls</h2>
        <div className="space-y-2">
          {(calls ?? []).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between text-sm border-b border-border/30 pb-2">
              <div>
                <div className="font-medium">{c.to_phone}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[260px]">{c.message}</div>
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
