import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — GlobalVerify" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [session, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
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
          <h1 className="font-display text-4xl text-gradient text-center">Welcome back</h1>
          <p className="text-sm text-muted-foreground text-center mt-2">Sign in to your account</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-accent hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" disabled={submitting} className="w-full gradient-primary shadow-glow">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-6">
            New here? <Link to="/signup" className="text-accent hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
