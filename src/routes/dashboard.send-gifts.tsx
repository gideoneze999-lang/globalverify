import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProducts } from "@/lib/products.functions";
import { addToCart } from "@/lib/cart.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Gift } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/dashboard/send-gifts")({ component: GiftsPage });

function GiftsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listProducts);
  const addFn = useServerFn(addToCart);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["products", "gift", search],
    queryFn: () => fn({ data: { category: "gift", search } }),
  });

  const add = useMutation({
    mutationFn: (id: string) => addFn({ data: { product_id: id, quantity: 1 } }),
    onSuccess: () => { toast.success("Added to cart"); qc.invalidateQueries({ queryKey: ["cart"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Gifts</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Send a gift</h1>
        <p className="text-muted-foreground mt-2">Curated gift cards & vouchers.</p>
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
            <div key={p.id} className="glass rounded-2xl overflow-hidden flex flex-col">
              {p.asset_url && <img src={p.asset_url} alt={p.title} className="w-full h-44 object-cover" loading="lazy" />}
              <div className="p-4 flex-1 flex flex-col">
                <div className="font-semibold">{p.title}</div>
                {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <div className="text-gradient font-display text-xl">{formatNGN(p.price_ngn)}</div>
                  <Button size="sm" className="gradient-primary" onClick={() => add.mutate(p.id)} disabled={add.isPending}>Add</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
