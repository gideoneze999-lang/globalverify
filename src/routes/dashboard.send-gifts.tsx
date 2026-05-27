import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProducts } from "@/lib/products.functions";
import { createGiftOrder } from "@/lib/orders.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/dashboard/send-gifts")({ component: GiftsPage });

type Tier = "same_day" | "next_day" | "within_week";

// Map a gift_category label to a sensible delivery tier default
function inferTier(cat: string | null | undefined): Tier {
  const c = (cat ?? "").toLowerCase();
  if (c.includes("same")) return "same_day";
  if (c.includes("next")) return "next_day";
  return "within_week";
}

function GiftsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listProducts);
  const orderFn = useServerFn(createGiftOrder);

  const [activeCat, setActiveCat] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<any | null>(null);
  const [form, setForm] = useState({ recipient_name: "", recipient_email: "", recipient_phone: "", message: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["products", "gift", search],
    queryFn: () => fn({ data: { category: "gift", search } }),
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((p: any) => { if (p.gift_category) set.add(p.gift_category); });
    return ["All", ...Array.from(set).sort()];
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    if (activeCat === "All") return data;
    return data.filter((p: any) => p.gift_category === activeCat);
  }, [data, activeCat]);

  // Group visible items by category (for the "All" view section headers)
  const grouped = useMemo(() => {
    if (activeCat !== "All") return [[activeCat, visible] as const];
    const m = new Map<string, any[]>();
    visible.forEach((p: any) => {
      const k = p.gift_category || "Uncategorised";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    });
    return Array.from(m.entries());
  }, [visible, activeCat]);

  const place = useMutation({
    mutationFn: () => orderFn({ data: {
      product_id: picked!.id,
      delivery_tier: inferTier(picked!.gift_category),
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

  // ─── Recipient + checkout step ───
  if (picked) {
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
            <div className="text-xs text-muted-foreground">{picked.gift_category || "Gift"}</div>
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

  // ─── Browse step ───
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Gifts</p>
        <h1 className="font-display text-4xl sm:text-5xl text-gradient mt-1">Send a gift</h1>
        <p className="text-muted-foreground mt-2 text-sm">Thoughtfully curated gifts — perfect for any occasion.</p>
      </div>

      {/* Category pill tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {categories.map((c) => {
          const active = c === activeCat;
          return (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                  : "bg-card text-foreground border-border hover:border-accent"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search gifts…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !visible.length ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          <Gift className="w-10 h-10 mx-auto text-accent" />
          <p className="mt-3 text-sm">No gifts in this category yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([cat, items]) => (
            <section key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-[2px] w-6 bg-accent rounded-full" />
                <h2 className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground font-semibold">{cat}</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {(items as any[]).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPicked(p)}
                    className="glass rounded-2xl overflow-hidden flex flex-col text-left hover:-translate-y-0.5 transition-transform"
                  >
                    {p.asset_url && <img src={p.asset_url} alt={p.title} className="w-full h-36 sm:h-44 object-cover" loading="lazy" />}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col">
                      <div className="font-semibold text-sm sm:text-base line-clamp-1">{p.title}</div>
                      {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                      <div className="mt-auto pt-3 text-gradient font-display text-lg sm:text-xl">{formatNGN(p.price_ngn)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="text-sm">
        <Link to="/dashboard/orders" className="text-accent hover:underline">View my gift orders →</Link>
      </div>
    </div>
  );
}
