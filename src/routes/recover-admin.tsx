import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/recover-admin")({
  head: () => ({
    meta: [
      { title: "Recover Super Admin · MekWorld Marines ERP" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RecoverAdminPage,
});

function RecoverAdminPage() {
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/public/recover-super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), recovery_key: key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Recovery failed");
      } else {
        toast.success("Super Admin role granted. You can sign in now.");
        setDone(true);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive grid place-items-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Super Admin Recovery</h1>
            <p className="text-sm text-muted-foreground">
              Restricted — requires recovery key
            </p>
          </div>
        </div>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm">
              Your account has been granted the Super Admin role. Continue to
              login.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Go to login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Account email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Recovery key</Label>
              <Input
                id="key"
                type="password"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                The secret key configured for this project. Keep it offline.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Grant Super Admin
            </Button>
            <div className="text-center text-sm">
              <Link to="/login" className="text-muted-foreground hover:text-foreground">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
