import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProducts } from "@/lib/products.functions";
import { addToCart } from "@/lib/cart.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

function ProductGrid({ category }: { category?: string }) {
  const qc = useQueryClient();
  const fn = useServerFn(listProducts);
  const addFn = useServerFn(addToCart);
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", category ?? "all", search],
    queryFn: () => fn({ data: { category, search } }),
  });

  const add = useMutation({
    mutationFn: (id: string) => addFn({ data: { product_id: id, quantity: 1 } }),
    onSuccess: () => { toast.success("Added to cart"); qc.invalidateQueries({ queryKey: ["cart"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
        !products?.length ? <p className="text-sm text-muted-foreground">No products yet.</p> :
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p: any) => (
            <div key={p.id} className="glass rounded-2xl overflow-hidden flex flex-col">
              {p.asset_url && <img src={p.asset_url} alt={p.title} className="w-full h-44 object-cover" loading="lazy" />}
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-accent uppercase tracking-wider">{p.category}</div>
                <div className="font-semibold mt-1">{p.title}</div>
                {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <div className="text-gradient font-display text-xl">{formatNGN(p.price_ngn)}</div>
                  <Button size="sm" className="gradient-primary" onClick={() => add.mutate(p.id)} disabled={add.isPending}>
                    <ShoppingCart className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </>
  );
}

export const Route = createFileRoute("/dashboard/marketplace")({
  component: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Marketplace</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Digital products</h1>
      </div>
      <ProductGrid />
    </div>
  ),
});
