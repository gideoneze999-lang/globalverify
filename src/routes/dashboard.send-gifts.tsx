import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProducts } from "@/lib/products.functions";
import { createGiftOrder } from "@/lib/orders.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Zap, Clock, Calendar, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/dashboard/send-gifts")({ component: GiftsPage });

type Tier = "same_day" | "next_day" | "within_week";

const tiers: { id: Tier; title: string; eta: string; icon: typeof Zap; color: string }[] = [
  { id: "same_day",     title: "Same day",      eta: "Delivered within 24 hours",   icon: Zap,      color: "bg-emerald-500" },
  { id: "next_day",     title: "Next day",      eta: "Delivered the following day", icon: Clock,    color: "bg-sky-500" },
  { id: "within_week",  title: "Within a week", eta: "Delivered in 2–7 days",       icon: Calendar, color: "bg-violet-500" },
];

function GiftsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listProducts);
  const orderFn = useServerFn(createGiftOrder);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<Tier | null>(null);
  const [picked, setPicked] = useState<any | null>(null);
  const [form, setForm] = useState({ recipient_name: "", recipient_email: "", recipient_phone: "", message: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["products", "gift", search],
    queryFn: () => fn({ data: { category: "gift", search } }),
    enabled: !!tier,
  });

  const place = useMutation({
    mutationFn: () => orderFn({ data: {
      product_id: picked!.id,
      delivery_tier: tier!,
      recipient_name: form.recipient_name,
      recipient_email: form.recipient_email || null,
      recipient_phone: form.recipient_phone || null,
      message: form.message || null,
    } }),
    onSuccess: (order: any) => {
      toast.success(`Gift order placed — tracking ${order.tracking_code}`, { duration: 6000 });
      qc.invalidateQueries({ queryKey: ["gift-orders"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      setPicked(null);
      setForm({ recipient_name: "", recipient_email: "", recipient_phone: "", message: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ─── Step 1: pick delivery tier ───
  if (!tier) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-accent uppercase tracking-widest">Gifts</p>
          <h1 className="font-display text-4xl sm:text-5xl text-gradient mt-1">Send a gift</h1>
          <p className="text-muted-foreground mt-2 text-sm">Choose how fast you need it delivered.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              className="glass rounded-2xl p-6 text-left hover:-translate-y-0.5 transition-transform"
            >
              <div className={`w-12 h-12 rounded-xl ${t.color} grid place-items-center text-white shadow-glow`}>
                <t.icon className="w-6 h-6" />
              </div>
              <div className="mt-4 font-display text-2xl">{t.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{t.eta}</div>
            </button>
          ))}
        </div>
        <div className="text-sm">
          <Link to="/dashboard/orders" className="text-accent hover:underline">View my gift orders →</Link>
        </div>
      </div>
    );
  }

  // ─── Step 2: pick a gift ───
  if (!picked) {
    return (
      <div className="space-y-6">
        <button onClick={() => setTier(null)} className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Change delivery speed
        </button>
        <div>
          <p className="text-sm text-accent uppercase tracking-widest">Pick a gift — {tiers.find(t => t.id === tier)?.title}</p>
          <h1 className="font-display text-3xl sm:text-4xl text-gradient mt-1">Choose what to send</h1>
        </div>
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search gifts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
          !data?.length ? (
            <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
              <Gift className="w-10 h-10 mx-auto text-accent" />
              <p className="mt-3 text-sm">No gifts available yet. Check back soon.</p>
            </div>
          ) :
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.map((p: any) => (
              <button key={p.id} onClick={() => setPicked(p)} className="glass rounded-2xl overflow-hidden flex flex-col text-left hover:-translate-y-0.5 transition-transform">
                {p.asset_url && <img src={p.asset_url} alt={p.title} className="w-full h-44 object-cover" loading="lazy" />}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="font-semibold">{p.title}</div>
                  {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                  <div className="mt-auto pt-3 text-gradient font-display text-xl">{formatNGN(p.price_ngn)}</div>
                </div>
              </button>
            ))}
          </div>
        }
      </div>
    );
  }

  // ─── Step 3: recipient + checkout ───
  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => setPicked(null)} className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Pick another gift
      </button>
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Recipient details</p>
        <h1 className="font-display text-3xl sm:text-4xl text-gradient mt-1">Who's it for?</h1>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 flex items-center gap-4">
        {picked.asset_url && <img src={picked.asset_url} alt="" className="w-16 h-16 rounded-lg object-cover" />}
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{picked.title}</div>
          <div className="text-xs text-muted-foreground">{tiers.find(t => t.id === tier)?.title}</div>
        </div>
        <div className="text-gradient font-display text-xl whitespace-nowrap">{formatNGN(picked.price_ngn)}</div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); place.mutate(); }} className="glass rounded-2xl p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Recipient name</Label>
            <Input required maxLength={120} value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
          </div>
          <div>
            <Label>Recipient email (optional)</Label>
            <Input type="email" maxLength={200} value={form.recipient_email} onChange={(e) => setForm({ ...form, recipient_email: e.target.value })} />
          </div>
          <div>
            <Label>Recipient phone (optional)</Label>
            <Input maxLength={40} value={form.recipient_phone} onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Personal message (optional)</Label>
            <Textarea maxLength={1000} rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/40 pt-4 gap-3 flex-wrap">
          <div>
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-gradient font-display text-2xl">{formatNGN(picked.price_ngn)}</div>
          </div>
          <Button type="submit" className="gradient-primary shadow-glow" disabled={place.isPending}>
            {place.isPending ? "Placing…" : "Pay from wallet"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">After payment, the order is sent to our team and you'll get a tracking code on the <Link to="/dashboard/orders" className="text-accent underline">My Orders</Link> page.</p>
      </form>
    </div>
  );
}
