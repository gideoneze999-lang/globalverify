import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Shield, LayoutDashboard, Phone, Gift, ShoppingBag, Wallet, ShoppingCart, History, User as UserIcon, Headphones, Menu, X, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GlobalVerify" }] }),
  component: DashboardLayout,
});

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/buy-number", label: "Buy Number", icon: Phone },
  { to: "/dashboard/send-gifts", label: "Send Gifts", icon: Gift },
  { to: "/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag },
  { to: "/dashboard/fund-wallet", label: "Fund Wallet", icon: Wallet },
  { to: "/dashboard/cart", label: "Cart", icon: ShoppingCart },
  { to: "/dashboard/transactions", label: "Transactions", icon: History },
  { to: "/dashboard/profile", label: "Profile", icon: UserIcon },
  { to: "/dashboard/support", label: "Support", icon: Headphones },
] as const;

function DashboardLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [session, loading, navigate]);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (loading || !session) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border flex flex-col transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary grid place-items-center shadow-glow">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Global<span className="text-gradient">Verify</span></span>
          </Link>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive(n.to, n.exact)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center px-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <button onClick={() => setMobileOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="ml-3 font-semibold">GlobalVerify</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}
