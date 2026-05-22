import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-accent uppercase tracking-widest">Account</p>
        <h1 className="font-display text-5xl text-gradient mt-1">Profile</h1>
      </div>
      <div className="glass rounded-2xl p-6 max-w-xl space-y-4">
        <div>
          <Label>Email</Label>
          <Input value={user?.email ?? ""} disabled className="mt-1.5" />
        </div>
        <div>
          <Label>User ID</Label>
          <Input value={user?.id ?? ""} disabled className="mt-1.5 text-xs" />
        </div>
        <Button variant="destructive" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
}
