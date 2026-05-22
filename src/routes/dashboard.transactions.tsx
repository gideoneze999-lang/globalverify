import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyTransactions } from "@/lib/transactions.functions";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/dashboard/transactions")({ component: TxPage });

function TxPage() {
  const fn = useServerFn(listMyTransactions);
  const { data, isLoading } = useQuery({ queryKey: ["my-tx"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">History</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Transactions</h1>
      </div>
      <div className="glass rounded-2xl p-6">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
          !data?.length ? <p className="text-sm text-muted-foreground">No transactions yet.</p> :
          <ul className="divide-y divide-border/40">
            {data.map((t: any) => (
              <li key={t.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{t.description ?? t.type}</div>
                  <div className="text-xs text-muted-foreground">{t.type} • {new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className={Number(t.amount) >= 0 ? "text-accent font-semibold" : "font-semibold"}>
                  {Number(t.amount) >= 0 ? "+" : ""}{formatNGN(t.amount)}
                </div>
              </li>
            ))}
          </ul>
        }
      </div>
    </div>
  );
}
