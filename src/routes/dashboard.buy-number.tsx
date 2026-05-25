import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCountries, listServices, buyNumber, listMyNumbers, checkOrder, cancelOrder } from "@/lib/numbers.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";
import { Phone, RefreshCw, X, Copy } from "lucide-react";

export const Route = createFileRoute("/dashboard/buy-number")({ component: BuyNumber });

function BuyNumber() {
  const qc = useQueryClient();
  const countriesFn = useServerFn(listCountries);
  const servicesFn = useServerFn(listServices);
  const buyFn = useServerFn(buyNumber);
  const myFn = useServerFn(listMyNumbers);
  const checkFn = useServerFn(checkOrder);
  const cancelFn = useServerFn(cancelOrder);

  const [country, setCountry] = useState("");
  const [search, setSearch] = useState("");

  const { data: countries, isLoading: cLoading, error: cError } = useQuery({ queryKey: ["countries"], queryFn: () => countriesFn() });
  const { data: services, isLoading: sLoading } = useQuery({
    queryKey: ["services", country], queryFn: () => servicesFn({ data: { country } }), enabled: !!country,
  });
  const { data: myNumbers } = useQuery({ queryKey: ["my-numbers"], queryFn: () => myFn(), refetchInterval: 5000 });

  const buyMut = useMutation({
    mutationFn: (service: string) => buyFn({ data: { country, service } }),
    onSuccess: () => { toast.success("Number purchased"); qc.invalidateQueries({ queryKey: ["my-numbers"] }); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const checkMut = useMutation({ mutationFn: (id: string) => checkFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["my-numbers"] }) });
  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => { toast.success("Cancelled & refunded"); qc.invalidateQueries({ queryKey: ["my-numbers"] }); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Auto-cancel pending orders after 10 minutes if no SMS received
  const autoCancelled = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!myNumbers) return;
    for (const n of myNumbers as any[]) {
      if (n.status !== "pending" || autoCancelled.current.has(n.id)) continue;
      const hasSms = Array.isArray(n.sms) && n.sms.length > 0;
      if (hasSms) continue;
      const ageMs = Date.now() - new Date(n.created_at).getTime();
      if (ageMs >= 10 * 60 * 1000) {
        autoCancelled.current.add(n.id);
        cancelMut.mutate(n.id);
        toast.info(`Number ${n.phone ?? ""} auto-refunded — no code in 10 minutes`);
      }
    }
  }, [myNumbers, cancelMut]);

  const filtered = (services ?? []).filter((s) => s.service.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Numbers</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Buy virtual number</h1>
        <p className="text-muted-foreground mt-2">Pick a country and service, receive an SMS code.</p>
      </div>

      {cError && (
        <div className="glass rounded-2xl p-4 text-sm text-destructive">{(cError as Error).message}</div>
      )}

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Country</label>
            <select
              value={country} onChange={(e) => setCountry(e.target.value)}
              className="w-full mt-1 bg-card border border-border rounded-md p-2.5 text-sm"
            >
              <option value="">{cLoading ? "Loading…" : "Select country"}</option>
              {(countries ?? []).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Search service</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. whatsapp, telegram" disabled={!country} />
          </div>
        </div>

        {country && (
          <div className="border-t border-border/40 pt-4">
            {sLoading ? <p className="text-sm text-muted-foreground">Loading services…</p> :
              filtered.length === 0 ? <p className="text-sm text-muted-foreground">No services found.</p> :
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto">
                {filtered.map((s) => (
                  <div key={s.service} className="rounded-lg border border-border/50 p-3 flex flex-col gap-2 bg-card/40">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm capitalize truncate">{s.service}</div>
                      <span className="text-xs text-muted-foreground">{s.qty} avail</span>
                    </div>
                    <div className="text-gradient font-display text-xl">{formatNGN(s.price_ngn)}</div>
                    <Button size="sm" className="gradient-primary" onClick={() => buyMut.mutate(s.service)} disabled={buyMut.isPending}>
                      Buy
                    </Button>
                  </div>
                ))}
              </div>
            }
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Your numbers</h2>
        {!myNumbers?.length ? (
          <p className="text-sm text-muted-foreground">No numbers yet.</p>
        ) : (
          <ul className="space-y-3">
            {myNumbers.map((n: any) => (
              <li key={n.id} className="rounded-lg border border-border/50 p-4 bg-card/40">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <Phone className="w-4 h-4 text-accent" /> {n.phone || "—"}
                      {n.phone && (
                        <button onClick={() => { navigator.clipboard.writeText(n.phone); toast.success("Copied"); }} className="text-muted-foreground hover:text-accent">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">{n.service} • {n.country} • {formatNGN(n.price_ngn)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      n.status === "received" ? "bg-accent/20 text-accent" :
                      n.status === "cancelled" || n.status === "timeout" ? "bg-destructive/20 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>{n.status}</span>
                    <Button size="sm" variant="ghost" onClick={() => checkMut.mutate(n.id)}><RefreshCw className="w-3.5 h-3.5" /></Button>
                    {n.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => cancelMut.mutate(n.id)}><X className="w-3.5 h-3.5" /></Button>
                    )}
                  </div>
                </div>
                {n.status === "pending" && (!Array.isArray(n.sms) || n.sms.length === 0) && (
                  <div className="mt-3 rounded-md bg-background/50 border border-dashed border-border p-3 text-sm">
                    <div className="text-xs text-accent uppercase tracking-wider">Waiting for code…</div>
                    <div className="font-mono text-muted-foreground mt-1">SMS will appear here. Auto-refund if none in 10 min.</div>
                  </div>
                )}
                {Array.isArray(n.sms) && n.sms.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {n.sms.map((s: any, i: number) => (
                      <div key={i} className="rounded-md bg-accent/10 border border-accent/30 p-3 text-sm">
                        <div className="text-xs text-muted-foreground">{s.sender ?? s.from ?? ""} • {s.date ? new Date(s.date).toLocaleString() : ""}</div>
                        <div className="font-mono text-lg text-accent mt-1">{s.code ?? s.text ?? ""}</div>
                        {s.code && s.text && <div className="text-xs text-muted-foreground mt-1">{s.text}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
