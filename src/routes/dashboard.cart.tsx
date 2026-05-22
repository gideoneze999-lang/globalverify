import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCart, removeFromCart, checkout } from "@/lib/cart.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/dashboard/cart")({ component: CartPage });

function CartPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCart);
  const removeFn = useServerFn(removeFromCart);
  const checkoutFn = useServerFn(checkout);

  const { data: items } = useQuery({ queryKey: ["cart"], queryFn: () => listFn() });

  const [s, setS] = useState({ full_name: "", phone: "", address: "", city: "", state: "" });

  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const place = useMutation({
    mutationFn: () => checkoutFn({ data: { shipping: s } }),
    onSuccess: (r: any) => {
      toast.success(`Order placed — ${formatNGN(r.total)} debited`);
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const total = (items ?? []).reduce((sum: number, i: any) => sum + Number(i.product.price_ngn) * i.quantity, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Cart</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Your cart</h1>
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
                <div className="flex items-center gap-3">
                  {i.product.asset_url && <img src={i.product.asset_url} alt="" className="w-14 h-14 rounded-md object-cover" />}
                  <div>
                    <div className="font-medium">{i.product.title}</div>
                    <div className="text-xs text-muted-foreground">x{i.quantity} • {formatNGN(i.product.price_ngn)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold">{formatNGN(Number(i.product.price_ngn) * i.quantity)}</div>
                  <button onClick={() => remove.mutate(i.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>

          <form onSubmit={(e) => { e.preventDefault(); place.mutate(); }} className="glass rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold">Shipping details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full name</Label><Input required value={s.full_name} onChange={(e) => setS({ ...s, full_name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input required value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Address</Label><Input required value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} /></div>
              <div><Label>City</Label><Input required value={s.city} onChange={(e) => setS({ ...s, city: e.target.value })} /></div>
              <div><Label>State</Label><Input required value={s.state} onChange={(e) => setS({ ...s, state: e.target.value })} /></div>
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-gradient font-display text-3xl">{formatNGN(total)}</div>
              </div>
              <Button type="submit" className="gradient-primary shadow-glow" disabled={place.isPending}>
                {place.isPending ? "Placing…" : "Pay from wallet"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
