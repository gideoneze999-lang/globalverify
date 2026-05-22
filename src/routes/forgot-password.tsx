import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — GlobalVerify" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-lg gradient-primary grid place-items-center shadow-glow">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">Global<span className="text-gradient">Verify</span></span>
        </Link>
        <div className="glass rounded-2xl p-8 shadow-glow">
          <h1 className="font-display text-4xl text-gradient text-center">Reset password</h1>
          {sent ? (
            <p className="mt-6 text-sm text-center text-muted-foreground">
              If an account exists for <span className="text-foreground">{email}</span>, we've sent a reset link.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full gradient-primary shadow-glow">
                {submitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
          <p className="text-sm text-center text-muted-foreground mt-6">
            <Link to="/login" className="text-accent hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
