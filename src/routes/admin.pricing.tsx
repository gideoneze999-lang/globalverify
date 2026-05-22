import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSettings, updatePricing } from "@/lib/pricing.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pricing")({ component: Pricing });

function Pricing() {
  const getFn = useServerFn(getSettings);
  const updFn = useServerFn(updatePricing);
  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => getFn() });

  const [markup, setMarkup] = useState("");
  const [rate, setRate] = useState("");
  useEffect(() => {
    if (data?.pricing) { setMarkup(String(data.pricing.markup_percent)); setRate(String(data.pricing.exchange_rate_ngn_per_usd)); }
  }, [data]);

  const mut = useMutation({
    mutationFn: () => updFn({ data: { markup_percent: Number(markup), exchange_rate_ngn_per_usd: Number(rate) } }),
    onSuccess: () => toast.success("Pricing updated"),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Admin</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Pricing</h1>
        <p className="text-muted-foreground mt-2">Applies to all 5sim number prices.</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="glass rounded-2xl p-6 space-y-4">
        <div>
          <Label>Markup percent (%)</Label>
          <Input type="number" min={0} step="0.01" value={markup} onChange={(e) => setMarkup(e.target.value)} required />
        </div>
        <div>
          <Label>Exchange rate (NGN per USD)</Label>
          <Input type="number" min={1} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} required />
        </div>
        <Button type="submit" className="gradient-primary shadow-glow" disabled={mut.isPending}>Save</Button>
      </form>
    </div>
  );
}
