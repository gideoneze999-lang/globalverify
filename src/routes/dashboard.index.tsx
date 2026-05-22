import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Phone, Plus } from "lucide-react";
import { myStats } from "@/lib/transactions.functions";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/dashboard/")({ component: OverviewPage });

function OverviewPage() {
  const { user } = useAuth();
  const stats = useServerFn(myStats);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: txData } = useQuery({
    queryKey: ["my-stats", user?.id],
    queryFn: () => stats(),
    enabled: !!user,
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-tx", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  const balance = Number(profile?.wallet_balance ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Dashboard</p>
        <h1 className="font-display text-5xl md:text-6xl text-gradient mt-1">
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
        </h1>
        <p className="text-muted-foreground mt-2">Here's a snapshot of your account.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="w-4 h-4 text-accent" /> Wallet balance
          </div>
          <div className="font-display text-5xl text-gradient mt-3">{formatNGN(balance)}</div>
          <Button asChild className="mt-4 gradient-primary shadow-glow" size="sm">
            <Link to="/dashboard/fund-wallet"><Plus className="w-4 h-4 mr-1" /> Fund wallet</Link>
          </Button>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-accent" /> Total spent
          </div>
          <div className="font-display text-5xl text-gradient mt-3">{formatNGN(txData?.spent ?? 0)}</div>
          <p className="text-xs text-muted-foreground mt-4">Across numbers and marketplace.</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4 text-accent" /> Active numbers
          </div>
          <div className="font-display text-5xl text-gradient mt-3">{txData?.activeNumbers ?? 0}</div>
          <p className="text-xs text-muted-foreground mt-4">
            <Link to="/dashboard/buy-number" className="text-accent hover:underline">Buy a number →</Link>
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold text-lg">Recent transactions</h2>
        {recent && recent.length > 0 ? (
          <ul className="mt-4 divide-y divide-border/40">
            {recent.map((t: any) => (
              <li key={t.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{t.description ?? t.type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className={Number(t.amount) >= 0 ? "text-accent font-semibold" : "text-foreground font-semibold"}>
                  {Number(t.amount) >= 0 ? "+" : ""}{formatNGN(t.amount)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 border-t border-border/40 py-12 text-center text-sm text-muted-foreground">
            No transactions yet.
          </div>
        )}
      </div>
    </div>
  );
}
