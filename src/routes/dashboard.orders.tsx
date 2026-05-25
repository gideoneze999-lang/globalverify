import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyProductOrders, listMyGiftOrders } from "@/lib/orders.functions";
import { Button } from "@/components/ui/button";
import { Package, Gift, ExternalLink, Copy, Truck } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/dashboard/orders")({ component: OrdersPage });

const tierLabel: Record<string, string> = {
  same_day: "Same day",
  next_day: "Next day",
  within_week: "Within a week",
};
const statusStyle: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  processing: "bg-sky-500/15 text-sky-400",
  processed: "bg-violet-500/15 text-violet-400",
  delivered: "bg-emerald-500/15 text-emerald-400",
};

function OrdersPage() {
  const prodFn = useServerFn(listMyProductOrders);
  const giftFn = useServerFn(listMyGiftOrders);

  const { data: products } = useQuery({ queryKey: ["product-orders"], queryFn: () => prodFn() });
  const { data: gifts } = useQuery({ queryKey: ["gift-orders"], queryFn: () => giftFn(), refetchInterval: 10_000 });

  function copy(text: string, label = "Copied") {
    navigator.clipboard.writeText(text);
    toast.success(label);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Orders</p>
        <h1 className="font-display text-4xl sm:text-5xl text-gradient mt-1">My orders</h1>
        <p className="text-muted-foreground mt-2 text-sm">Product access links and gift order tracking.</p>
      </div>

      {/* Product orders */}
      <section className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-accent" /> Marketplace purchases</h2>
        {!products?.length ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No purchases yet. <Link to="/dashboard/marketplace" className="text-accent underline">Browse marketplace</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {products.map((o: any) => (
              <li key={o.id} className="glass rounded-2xl p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-medium">{o.product?.title ?? "Product"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(o.created_at).toLocaleString()} • {formatNGN(o.amount_ngn)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Tracking: <button onClick={() => copy(o.tracking_code)} className="font-mono text-accent hover:underline">{o.tracking_code}</button>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[o.status] ?? ""}`}>{o.status}</span>
                </div>
                {o.access_link ? (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
                    <ExternalLink className="w-4 h-4 text-accent shrink-0" />
                    <a href={o.access_link} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline truncate flex-1">{o.access_link}</a>
                    <button onClick={() => copy(o.access_link, "Link copied")} className="text-muted-foreground hover:text-accent"><Copy className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-muted-foreground italic">Awaiting access link from admin — we'll notify you soon.</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Gift orders */}
      <section className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Gift className="w-4 h-4 text-accent" /> Gift orders</h2>
        {!gifts?.length ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No gift orders yet. <Link to="/dashboard/send-gifts" className="text-accent underline">Send a gift</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {gifts.map((g: any) => (
              <li key={g.id} className="glass rounded-2xl p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-medium">{g.product?.title ?? "Gift"} → {g.recipient_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(g.created_at).toLocaleString()} • {formatNGN(g.amount_ngn)} • {tierLabel[g.delivery_tier]}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Tracking:
                      <button onClick={() => copy(g.tracking_code)} className="font-mono text-accent hover:underline">{g.tracking_code}</button>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusStyle[g.status] ?? ""}`}>{g.status}</span>
                </div>
                {g.admin_note && (
                  <div className="mt-3 rounded-lg bg-card/50 border border-border/40 p-3 text-xs text-muted-foreground">
                    <span className="text-accent font-semibold">Admin note: </span>{g.admin_note}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div>
          <Button asChild variant="outline" size="sm"><Link to="/dashboard/send-gifts">Send another gift</Link></Button>
        </div>
      </section>
    </div>
  );
}
