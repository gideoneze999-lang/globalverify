import { createFileRoute } from "@tanstack/react-router";
import { Key } from "lucide-react";

export const Route = createFileRoute("/admin/api-config")({
  component: () => (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Admin</p>
        <h1 className="font-display text-5xl text-gradient mt-1">5sim API</h1>
      </div>
      <div className="glass rounded-2xl p-6 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-lg gradient-primary grid place-items-center shrink-0"><Key className="w-5 h-5 text-primary-foreground" /></div>
        <div className="space-y-2 text-sm">
          <p>Your 5sim API key is stored as a secure server-side secret (<code className="text-accent">SIM5_API_KEY</code>) and never reaches the browser.</p>
          <p className="text-muted-foreground">To rotate it, ask Lovable to update the secret.</p>
        </div>
      </div>
    </div>
  ),
});
