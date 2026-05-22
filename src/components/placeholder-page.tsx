import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";

export function PlaceholderPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Dashboard</p>
        <h1 className="font-display text-5xl text-gradient mt-1">{title}</h1>
        <p className="text-muted-foreground mt-2">{subtitle}</p>
      </div>
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-14 h-14 rounded-2xl gradient-primary grid place-items-center mx-auto shadow-glow">
          <Sparkles className="w-6 h-6 text-primary-foreground" />
        </div>
        <h2 className="mt-5 font-semibold text-lg">Coming soon</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          This section is being built. The page shell and navigation are ready — full functionality lands in Phase 2.
        </p>
        <Link to="/dashboard" className="mt-6 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to overview
        </Link>
      </div>
    </div>
  );
}
