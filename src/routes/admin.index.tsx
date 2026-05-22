import { createFileRoute } from "@tanstack/react-router";
import { Users, CheckSquare, DollarSign, Boxes } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const stats = [
    { icon: Users, label: "Registered users", value: "—" },
    { icon: CheckSquare, label: "Pending approvals", value: "0" },
    { icon: DollarSign, label: "Approved total", value: "₦0" },
    { icon: Boxes, label: "Products listed", value: "0" },
  ];
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Admin</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Overview</h1>
        <p className="text-muted-foreground mt-2">Wallet approvals, product catalog, and user management — feature pages land in Phase 2.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <s.icon className="w-4 h-4 text-accent" /> {s.label}
            </div>
            <div className="font-display text-4xl text-gradient mt-3">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold">How admin access works</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Admin status is granted via the secure <code className="px-1.5 py-0.5 rounded bg-muted/50">user_roles</code> table in the backend — there is no hardcoded password.
          Ask the platform owner to add your account to the admin role.
        </p>
      </div>
    </div>
  );
}
