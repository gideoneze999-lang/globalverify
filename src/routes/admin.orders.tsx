import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListGiftOrders, adminUpdateGiftOrder, adminListProductOrders } from "@/lib/orders.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Package } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const tierLabel: Record<string, string> = { same_day: "Same day", next_day: "Next day", within_week: "Within a week" };
const statuses = ["pending", "processing", "processed", "delivered"] as const;

function AdminOrders() {
  const qc = useQueryClient();
  const giftFn = useServerFn(adminListGiftOrders);
  const prodFn = useServerFn(adminListProductOrders);
  const updFn = useServerFn(adminUpdateGiftOrder);

  const { data: gifts } = useQuery({ queryKey: ["admin-gift-orders"], queryFn: () => giftFn(), refetchInterval: 15_000 });
  const { data: prods } = useQuery({ queryKey: ["admin-product-orders"], queryFn: () => prodFn() });

  const upd = useMutation({
    mutationFn: (v: { id: string; status?: typeof statuses[number]; admin_note?: string | null }) => updFn({ data: v }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-gift-orders"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Admin</p>
        <h1 className="font-display text-4xl sm:text-5xl text-gradient mt-1">Orders</h1>
      </div>

      <section className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Gift className="w-4 h-4 text-accent" /> Gift orders ({gifts?.length ?? 0})</h2>
        {!gifts?.length ? (
          <div className="glass rounded-2xl p-8 text-sm text-muted-foreground">No gift orders yet.</div>
        ) : (
          <ul className="space-y-3">
            {gifts.map((g: any) => (
              <GiftRow key={g.id} g={g} onUpdate={(v) => upd.mutate({ id: g.id, ...v })} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-accent" /> Marketplace orders ({prods?.length ?? 0})</h2>
        {!prods?.length ? (
          <div className="glass rounded-2xl p-8 text-sm text-muted-foreground">No marketplace orders yet.</div>
        ) : (
          <ul className="glass rounded-2xl divide-y divide-border/40">
            {prods.map((o: any) => (
              <li key={o.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium text-sm">{o.product?.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()} • {formatNGN(o.amount_ngn)} • <span className="font-mono">{o.tracking_code}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${o.access_link ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                  {o.access_link ? "link delivered" : "no link set"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function GiftRow({ g, onUpdate }: { g: any; onUpdate: (v: { status?: typeof statuses[number]; admin_note?: string | null }) => void }) {
  const [note, setNote] = useState(g.admin_note ?? "");
  return (
    <li className="glass rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-semibold">{g.product?.title} → {g.recipient_name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {new Date(g.created_at).toLocaleString()} • {formatNGN(g.amount_ngn)} • {tierLabel[g.delivery_tier]} • <span className="font-mono">{g.tracking_code}</span>
          </div>
          {(g.recipient_email || g.recipient_phone) && (
            <div className="text-xs text-muted-foreground mt-1">
              {g.recipient_email && <>📧 {g.recipient_email} </>}
              {g.recipient_phone && <>📱 {g.recipient_phone}</>}
            </div>
          )}
          {g.message && <div className="text-xs italic text-muted-foreground mt-2">"{g.message}"</div>}
        </div>
        <select
          value={g.status}
          onChange={(e) => onUpdate({ status: e.target.value as typeof statuses[number] })}
          className="bg-card border border-border rounded-md px-2 py-1.5 text-sm"
        >
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Textarea rows={2} placeholder="Admin note (visible to buyer)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button size="sm" variant="outline" onClick={() => onUpdate({ admin_note: note || null })}>Save note</Button>
      </div>
    </li>
  );
}
