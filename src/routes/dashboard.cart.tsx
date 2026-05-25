import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCart, removeFromCart, checkout } from "@/lib/cart.functions";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/dashboard/cart")({ component: CartPage });

function CartPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCart);
  const removeFn = useServerFn(removeFromCart);
  const checkoutFn = useServerFn(checkout);

  const { data: items } = useQuery({ queryKey: ["cart"], queryFn: () => listFn() });

  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const place = useMutation({
    mutationFn: () => checkoutFn(),
    onSuccess: (r: any) => {
      toast.success(`Paid ${formatNGN(r.total)} — check My Orders for your link`, { duration: 5000 });
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["product-orders"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const total = (items ?? []).reduce((sum: number, i: any) => sum + Number(i.product.price_ngn) * i.quantity, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Cart</p>
        <h1 className="font-display text-4xl sm:text-5xl text-gradient mt-1">Your cart</h1>
      </div>

      {!items?.length ? (
        <div className="glass rounded-2xl p-12 text-center">
          <ShoppingBag className="w-10 h-10 mx-auto text-accent" />
          <p className="mt-3 text-sm text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4 gradient-primary"><Link to="/dashboard/marketplace">Browse marketplace</Link></Button>
        </div>
      ) : (
        <>
          <ul className="glass rounded-2xl divide-y divide-border/40">
            {items.map((i: any) => (
              <li key={i.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {i.product.asset_url && <img src={i.product.asset_url} alt="" className="w-14 h-14 rounded-md object-cover" />}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.product.title}</div>
                    <div className="text-xs text-muted-foreground">x{i.quantity} • {formatNGN(i.product.price_ngn)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="font-semibold">{formatNGN(Number(i.product.price_ngn) * i.quantity)}</div>
                  <button onClick={() => remove.mutate(i.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>

          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <p>Digital delivery — your product access link will appear on the <Link to="/dashboard/orders" className="text-accent underline">My Orders</Link> page immediately after payment.</p>
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-4 gap-3 flex-wrap">
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-gradient font-display text-3xl">{formatNGN(total)}</div>
              </div>
              <Button onClick={() => place.mutate()} className="gradient-primary shadow-glow" disabled={place.isPending}>
                {place.isPending ? "Processing…" : "Pay from wallet"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
