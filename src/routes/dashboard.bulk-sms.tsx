import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { sendBulkSms, listMyBulkJobs } from "@/lib/messaging.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

export const Route = createFileRoute("/dashboard/bulk-sms")({
  head: () => ({ meta: [{ title: "Bulk SMS — GlobalVerify" }] }),
  component: BulkSmsPage,
});

function BulkSmsPage() {
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const qc = useQueryClient();
  const sendFn = useServerFn(sendBulkSms);
  const listFn = useServerFn(listMyBulkJobs);

  const { data: jobs } = useQuery({ queryKey: ["bulkJobs"], queryFn: () => listFn() });

  const mutation = useMutation({
    mutationFn: async () => {
      const list = recipients.split(/[\n,;\s]+/).map((s) => s.trim()).filter(Boolean);
      return sendFn({ data: { message, recipients: list } });
    },
    onSuccess: (r) => {
      toast.success(`Sent ${r.sent}, failed ${r.failed}. Charged ₦${r.cost.toLocaleString()}`);
      setRecipients(""); setMessage("");
      qc.invalidateQueries({ queryKey: ["bulkJobs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient flex items-center gap-2"><MessageSquare className="w-7 h-7" /> Bulk SMS</h1>
        <p className="text-sm text-muted-foreground mt-1">Send SMS to any phone numbers worldwide. We auto-pick a local sender by country.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Recipients (international format, one per line)</label>
          <Textarea rows={6} value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="+14155552671&#10;+2348012345678&#10;+447700900123" />
        </div>
        <div>
          <label className="text-sm font-medium">Message</label>
          <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1600} placeholder="Your message…" />
          <div className="text-xs text-muted-foreground mt-1">{message.length} chars</div>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !message || !recipients}>
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
