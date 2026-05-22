import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getSettings } from "@/lib/pricing.functions";
import { createDeposit, listMyDeposits } from "@/lib/deposits.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/dashboard/fund-wallet")({ component: FundWallet });

function FundWallet() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const settings = useServerFn(getSettings);
  const create = useServerFn(createDeposit);
  const list = useServerFn(listMyDeposits);

  const { data: cfg } = useQuery({ queryKey: ["settings"], queryFn: () => settings() });
  const { data: deposits } = useQuery({ queryKey: ["my-deposits"], queryFn: () => list() });

  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const mut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const amt = Number(amount);
      if (!amt || amt <= 0) throw new Error("Enter a valid amount");
      let url: string | null = null;
      if (file) {
        setUploading(true);
        const ext = file.name.split(".").pop() ?? "png";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("receipts").upload(path, file, { contentType: file.type });
        setUploading(false);
        if (error) throw new Error(error.message);
        url = path; // store path; admin uses signed URL
      }
      return create({ data: { amount: amt, screenshot_url: url } });
    },
    onSuccess: () => {
      toast.success("Deposit submitted — awaiting admin approval");
      setAmount(""); setFile(null);
      qc.invalidateQueries({ queryKey: ["my-deposits"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bank = cfg?.bank ?? { account_name: "", bank: "", account_number: "" };

  function copy(text: string) { navigator.clipboard.writeText(text); toast.success("Copied"); }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Wallet</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Fund your wallet</h1>
        <p className="text-muted-foreground mt-2">Transfer to the bank account below, then upload your receipt for review.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Bank details</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: "Bank", value: bank.bank },
            { label: "Account name", value: bank.account_name },
            { label: "Account number", value: bank.account_number },
          ].map((row) => (
            <div key={row.label} className="rounded-lg bg-card/60 border border-border/50 p-4">
              <div className="text-xs text-muted-foreground uppercase">{row.label}</div>
              <div className="flex items-center justify-between mt-1 gap-2">
                <div className="font-medium truncate">{row.value || "—"}</div>
                {row.value && (
                  <button onClick={() => copy(row.value)} className="text-muted-foreground hover:text-accent">
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
        className="glass rounded-2xl p-6 space-y-4"
      >
        <h2 className="font-semibold">Submit deposit</h2>
        <div>
          <Label htmlFor="amount">Amount (NGN)</Label>
          <Input id="amount" type="number" min={1} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="file">Payment receipt (optional)</Label>
          <Input id="file" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <Button type="submit" disabled={mut.isPending || uploading} className="gradient-primary shadow-glow">
          <UploadCloud className="w-4 h-4 mr-2" />
          {mut.isPending || uploading ? "Submitting…" : "Submit for approval"}
        </Button>
      </form>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Your deposits</h2>
        {deposits && deposits.length > 0 ? (
          <ul className="divide-y divide-border/40">
            {deposits.map((d: any) => (
              <li key={d.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <div className="font-medium">{formatNGN(d.amount)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  d.status === "approved" ? "bg-accent/20 text-accent" :
                  d.status === "rejected" ? "bg-destructive/20 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>{d.status}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No deposits yet.</p>}
      </div>
    </div>
  );
}
