import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Phone, Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: OverviewPage,
});

function OverviewPage() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
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
          <div className="font-display text-5xl text-gradient mt-3">
            ₦{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </div>
          <Button asChild className="mt-4 gradient-primary shadow-glow" size="sm">
            <Link to="/dashboard/fund-wallet"><Plus className="w-4 h-4 mr-1" /> Fund wallet</Link>
          </Button>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-accent" /> Total spent
          </div>
          <div className="font-display text-5xl text-gradient mt-3">₦0.00</div>
          <p className="text-xs text-muted-foreground mt-4">No purchases yet.</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4 text-accent" /> Active numbers
          </div>
          <div className="font-display text-5xl text-gradient mt-3">0</div>
          <p className="text-xs text-muted-foreground mt-4">Buy your first number to get started.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold text-lg">Recent transactions</h2>
        <div className="mt-4 border-t border-border/40 py-12 text-center text-sm text-muted-foreground">
          No transactions yet. Once you fund your wallet or purchase a number, you'll see it here.
        </div>
      </div>
    </div>
  );
}
