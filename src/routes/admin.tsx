import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { checkIsAdmin } from "@/lib/admin.functions";
import { Shield, LayoutDashboard, CheckSquare, Key, DollarSign, UploadCloud, Boxes, Users, LogOut, Menu, X, PackageCheck, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — GlobalVerify" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/approvals", label: "Wallet Approvals", icon: CheckSquare },
  { to: "/admin/orders", label: "Orders & Gifts", icon: PackageCheck },
  { to: "/admin/api-config", label: "5sim API Config", icon: Key },
  { to: "/admin/pricing", label: "Pricing Manager", icon: DollarSign },
  { to: "/admin/upload", label: "Upload Product", icon: UploadCloud },
  { to: "/admin/products", label: "Manage Products", icon: Boxes },
  { to: "/admin/users", label: "Users", icon: Users },
] as Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }>;

function AdminLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const check = useServerFn(checkIsAdmin);

  const { data, isLoading } = useQuery({
    queryKey: ["isAdmin", session?.user?.id],
    queryFn: () => check(),
    enabled: !!session,
  });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [session, loading, navigate]);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (loading || !session || isLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }

  if (!data?.isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="glass rounded-2xl p-10 max-w-md text-center shadow-glow">
          <Shield className="w-10 h-10 text-accent mx-auto" />
          <h1 className="font-display text-4xl text-gradient mt-3">Admin only</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Your account doesn't have admin access. Ask the platform owner to grant you the admin role.
          </p>
          <Link to="/dashboard" className="mt-5 inline-block text-accent hover:underline text-sm">Back to dashboard</Link>
        </div>
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
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border flex flex-col transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <img src={logo} alt="GlobalVerify logo" width={32} height={32} className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
            <span className="font-bold text-sm">Admin <span className="text-gradient">Panel</span></span>
          </div>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              isActive(n.to, n.exact) ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}>
              <n.icon className="w-4 h-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link to="/dashboard" className="block px-3 py-2 text-xs text-muted-foreground hover:text-foreground">← User dashboard</Link>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center px-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <button onClick={() => setMobileOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="ml-3 font-semibold">Admin</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}
