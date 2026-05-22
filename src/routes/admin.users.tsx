import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listUsers, adjustBalance } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/admin/users")({ component: Users });

function Users() {
  const qc = useQueryClient();
  const listFn = useServerFn(listUsers);
  const adjFn = useServerFn(adjustBalance);
  const { data } = useQuery({ queryKey: ["admin-users"], queryFn: () => listFn() });
  const adj = useMutation({
    mutationFn: (v: { user_id: string; delta: number; note?: string }) => adjFn({ data: v }),
    onSuccess: (r: any) => { toast.success(`New balance: ${formatNGN(r.newBalance)}`); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  function prompt2(user_id: string, current: number) {
    const raw = prompt(`Enter adjustment amount (positive to credit, negative to debit). Current balance: ${formatNGN(current)}`);
    if (raw == null) return;
    const n = Number(raw);
    if (!n || Number.isNaN(n)) return toast.error("Invalid amount");
    const note = prompt("Note (optional)") || undefined;
    adj.mutate({ user_id, delta: n, note });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Admin</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Users</h1>
      </div>
      <div className="glass rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border/40">
            <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Balance</th><th className="p-3 text-right">Action</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((u: any) => (
              <tr key={u.id} className="border-b border-border/20">
                <td className="p-3">{u.first_name} {u.last_name}</td>
                <td className="p-3 text-muted-foreground">{u.phone ?? "—"}</td>
                <td className="p-3 font-semibold text-gradient">{formatNGN(u.wallet_balance)}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => prompt2(u.id, Number(u.wallet_balance))}>Adjust</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
