import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Wallet, Plus, Phone, History, ShoppingCart, Gift, ShoppingBag,
  Coins, Smartphone, ArrowDownLeft, ArrowUpRight,
} from "lucide-react";
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

  const actions = [
    { to: "/dashboard/buy-number", label: "Buy Number", icon: Phone, color: "bg-emerald-500", glow: "shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)]" },
    { to: "/dashboard/fund-wallet", label: "Add Funds", icon: Plus, color: "bg-violet-500", glow: "shadow-[0_8px_24px_-8px_rgba(139,92,246,0.6)]" },
    { to: "/dashboard/transactions", label: "My Numbers", icon: Smartphone, color: "bg-amber-500", glow: "shadow-[0_8px_24px_-8px_rgba(245,158,11,0.6)]" },
    { to: "/dashboard/send-gifts", label: "Send Gifts", icon: Gift, color: "bg-pink-500", glow: "shadow-[0_8px_24px_-8px_rgba(236,72,153,0.6)]" },
    { to: "/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag, color: "bg-sky-500", glow: "shadow-[0_8px_24px_-8px_rgba(14,165,233,0.6)]" },
    { to: "/dashboard/cart", label: "Cart", icon: ShoppingCart, color: "bg-rose-500", glow: "shadow-[0_8px_24px_-8px_rgba(244,63,94,0.6)]" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <p className="text-xs text-accent uppercase tracking-widest">Dashboard</p>
        <h1 className="font-display text-3xl md:text-4xl mt-1">
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ""} <span className="text-gradient">back</span>
        </h1>
      </div>

      {/* Available Balance hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[oklch(0.22_0.06_275)] to-[oklch(0.14_0.04_270)] border border-border/40 p-6 sm:p-8 shadow-glow">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="w-4 h-4 text-accent" /> Available Balance
          </div>
          <div className="font-display text-5xl sm:text-6xl mt-2 text-white">
            {formatNGN(balance)}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" className="bg-white text-background hover:bg-white/90">
              <Link to="/dashboard/fund-wallet"><Plus className="w-4 h-4 mr-1" /> Add Funds</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
              <Link to="/dashboard/buy-number"><Phone className="w-4 h-4 mr-1" /> Buy Number</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white">
              <Link to="/dashboard/transactions"><History className="w-4 h-4 mr-1" /> History</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards with colored top borders */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Coins} label="Total Spent (Lifetime)" value={formatNGN(txData?.spent ?? 0)} bar="bg-violet-500" iconBg="bg-violet-500/15 text-violet-400" />
        <StatCard icon={Smartphone} label="Numbers Purchased" value={String(txData?.activeNumbers ?? 0)} bar="bg-sky-500" iconBg="bg-sky-500/15 text-sky-400" />
        <StatCard icon={Gift} label="Referral Balance" value={formatNGN(0)} bar="bg-amber-500" iconBg="bg-amber-500/15 text-amber-400" />
      </div>

      {/* Action grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="glass rounded-2xl p-5 flex flex-col items-center text-center hover:-translate-y-0.5 transition-transform"
          >
            <div className={`w-14 h-14 rounded-2xl grid place-items-center text-white ${a.color} ${a.glow}`}>
              <a.icon className="w-6 h-6" />
            </div>
            <div className="mt-3 font-semibold text-sm">{a.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <History className="w-4 h-4 text-accent" /> Recent transactions
          </h2>
          <Link to="/dashboard/transactions" className="text-xs text-accent hover:underline">View all →</Link>
        </div>
        {recent && recent.length > 0 ? (
          <ul className="mt-4 divide-y divide-border/40">
            {recent.map((t: any) => {
              const positive = Number(t.amount) >= 0;
              return (
                <li key={t.id} className="py-3 flex items-center justify-between text-sm gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg grid place-items-center ${positive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                      {positive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{t.description ?? t.type}</div>
                      <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className={positive ? "text-emerald-400 font-semibold whitespace-nowrap" : "text-foreground font-semibold whitespace-nowrap"}>
                    {positive ? "+" : ""}{formatNGN(t.amount)}
                  </div>
                </li>
              );
            })}
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

function StatCard({
  icon: Icon, label, value, bar, iconBg,
}: { icon: any; label: string; value: string; bar: string; iconBg: string }) {
  return (
    <div className="relative glass rounded-2xl p-5 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${bar}`} />
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-xs text-muted-foreground mt-3">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}
