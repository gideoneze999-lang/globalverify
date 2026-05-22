import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProducts, deleteProduct } from "@/lib/products.functions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/admin/products")({ component: ManageProducts });

function ManageProducts() {
  const qc = useQueryClient();
  const listFn = useServerFn(listProducts);
  const delFn = useServerFn(deleteProduct);
  const { data } = useQuery({ queryKey: ["products", "all", ""], queryFn: () => listFn({ data: {} }) });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["products"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Admin</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Manage products</h1>
      </div>
      {!data?.length ? <p className="text-sm text-muted-foreground">No products yet.</p> :
        <ul className="glass rounded-2xl divide-y divide-border/40">
          {data.map((p: any) => (
            <li key={p.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {p.asset_url && <img src={p.asset_url} alt="" className="w-12 h-12 rounded object-cover" />}
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.category} • {formatNGN(p.price_ngn)}</div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => confirm("Delete this product?") && del.mutate(p.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      }
    </div>
  );
}
