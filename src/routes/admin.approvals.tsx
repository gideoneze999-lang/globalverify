import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllDeposits, decideDeposit, getReceiptSignedUrl } from "@/lib/deposits.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";
import { Check, X, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/approvals")({ component: Approvals });

function Approvals() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllDeposits);
  const decideFn = useServerFn(decideDeposit);
  const signFn = useServerFn(getReceiptSignedUrl);

  const { data } = useQuery({ queryKey: ["all-deposits"], queryFn: () => listFn() });

  useEffect(() => {
    const ch = supabase.channel("deposits-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, () => {
        qc.invalidateQueries({ queryKey: ["all-deposits"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "approved" | "rejected" }) => decideFn({ data: v }),
    onSuccess: () => { toast.success("Done"); qc.invalidateQueries({ queryKey: ["all-deposits"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const [viewing, setViewing] = useState<string | null>(null);
  async function view(path: string) {
    setViewing("loading");
    try {
      const r = await signFn({ data: { path } });
      setViewing(r.url);
    } catch (e: any) { toast.error(e.message); setViewing(null); }
  }

  const pending = (data ?? []).filter((d: any) => d.status === "pending");
  const decided = (data ?? []).filter((d: any) => d.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Admin</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Wallet approvals</h1>
        <p className="text-muted-foreground mt-2">Updates live via realtime.</p>
      </div>

      <Section title={`Pending (${pending.length})`} items={pending} onView={view} onDecide={(id, decision) => decide.mutate({ id, decision })} showActions />
      <Section title="History" items={decided.slice(0, 50)} onView={view} onDecide={() => {}} />

      {viewing && (
        <div className="fixed inset-0 bg-black/80 z-50 grid place-items-center p-4" onClick={() => setViewing(null)}>
          <div className="bg-card rounded-2xl p-3 max-w-2xl max-h-[90vh] overflow-auto">
            {viewing === "loading" ? <p>Loading…</p> :
              viewing.includes(".pdf") ? <iframe src={viewing} className="w-[80vw] h-[80vh]" /> :
              <img src={viewing} alt="receipt" className="max-w-full max-h-[85vh]" />
            }
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, items, onView, onDecide, showActions }: { title: string; items: any[]; onView: (path: string) => void; onDecide: (id: string, d: "approved" | "rejected") => void; showActions?: boolean }) {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-semibold mb-4">{title}</h2>
      {!items.length ? <p className="text-sm text-muted-foreground">Nothing here.</p> :
        <ul className="divide-y divide-border/40">
          {items.map((d) => (
            <li key={d.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <div className="font-semibold">{formatNGN(d.amount)} <span className="text-xs text-muted-foreground font-normal">— {d.profile?.first_name ?? "User"} {d.profile?.last_name ?? ""} ({d.profile?.phone ?? "—"})</span></div>
                <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                {d.screenshot_url && (
                  <Button size="sm" variant="ghost" onClick={() => onView(d.screenshot_url)}><Eye className="w-4 h-4 mr-1" /> Receipt</Button>
                )}
                {showActions ? (
                  <>
                    <Button size="sm" className="gradient-primary" onClick={() => onDecide(d.id, "approved")}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => onDecide(d.id, "rejected")}><X className="w-4 h-4 mr-1" /> Reject</Button>
                  </>
                ) : (
                  <span className={`text-xs px-2 py-1 rounded-full ${d.status === "approved" ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"}`}>{d.status}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      }
    </div>
  );
}
