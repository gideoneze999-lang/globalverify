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
        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-foreground">5sim API</p>
            <p>Your 5sim API key is stored as a secure server-side secret (<code className="text-accent">SIM5_API_KEY</code>).</p>
          </div>
          <div className="pt-4 border-t border-border/50 space-y-2">
            <p className="font-medium text-foreground">Paystack API</p>
            <p>Paystack Secret Key is stored as <code className="text-accent">PAYSTACK_SECRET_KEY</code>.</p>
            <p className="text-xs text-muted-foreground break-all">
              Webhook URL: <code className="text-accent select-all">https://fdilfzwvohtnztyxupeb.supabase.co/functions/v1/paystack-webhook</code>
            </p>
          </div>
          <p className="text-muted-foreground pt-2">To rotate these, ask Lovable to update the secrets.</p>
        </div>
      </div>
    </div>
  ),
});
