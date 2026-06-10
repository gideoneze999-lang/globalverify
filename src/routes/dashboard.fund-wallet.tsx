import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getSettings } from "@/lib/pricing.functions";
import { createDeposit, listMyDeposits } from "@/lib/deposits.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, UploadCloud, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";
import { PaystackButton } from "react-paystack";

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
        <p className="text-muted-foreground mt-2">Choose your preferred method to add funds to your wallet.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 space-y-6 flex flex-col">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              Pay with Card / Bank Transfer
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Instant funding via Paystack (Automated)</p>
          </div>
          
          <div className="space-y-4 flex-1 flex flex-col justify-end">
            <div>
              <Label htmlFor="paystack-amount">Amount (NGN)</Label>
              <Input 
                id="paystack-amount" 
                type="number" 
                min={100} 
                placeholder="Minimum 100" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
              />
            </div>
            
            {Number(amount) >= 100 && user?.email ? (
              <PaystackButton
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gradient-primary shadow-glow h-10 px-4 py-2"
                {...{
                  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
                  email: user.email,
                  amount: Number(amount) * 100,
                  metadata: {
                    user_id: user.id,
                    custom_fields: [
                      {
                        display_name: "User ID",
                        variable_name: "user_id",
                        value: user.id,
                      }
                    ]
                  },
                  text: "Pay with Paystack",
                  onSuccess: (reference: any) => {
                    toast.success("Payment successful! Your balance will update shortly.");
                    setAmount("");
                    qc.invalidateQueries({ queryKey: ["my-deposits"] });
                    qc.invalidateQueries({ queryKey: ["profile"] });
                  },
                  onClose: () => toast.info("Payment cancelled"),
                }}
              />
            ) : (
              <Button disabled className="w-full opacity-50 cursor-not-allowed">
                Enter amount (min 100)
              </Button>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Manual Bank Transfer</h2>
          <div className="space-y-3">
            {[
              { label: "Bank", value: bank.bank },
              { label: "Account name", value: bank.account_name },
              { label: "Account number", value: bank.account_number },
            ].map((row) => (
              <div key={row.label} className="rounded-lg bg-card/40 border border-border/30 p-3">
                <div className="text-[10px] text-muted-foreground uppercase">{row.label}</div>
                <div className="flex items-center justify-between mt-0.5 gap-2">
                  <div className="font-medium text-sm truncate">{row.value || "—"}</div>
                  {row.value && (
                    <button onClick={() => copy(row.value)} className="text-muted-foreground hover:text-accent p-1">
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground italic">Manual transfers may take up to 24 hours to be processed.</p>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
        className="glass rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Submit Payment Receipt</h2>
          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">Manual Approval</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Amount (NGN)</Label>
            <Input id="amount" type="number" min={1} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="file">Receipt Screenshot</Label>
            <Input id="file" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <Button type="submit" disabled={mut.isPending || uploading} className="w-full bg-secondary/50 hover:bg-secondary">
          <UploadCloud className="w-4 h-4 mr-2" />
          {mut.isPending || uploading ? "Submitting…" : "Submit Manual Receipt"}
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
