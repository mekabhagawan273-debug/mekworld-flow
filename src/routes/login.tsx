import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Anchor, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · MekWorld Marines ERP" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!loading && user) nav({ to: "/", replace: true });
  }, [user, loading, nav]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) toast.error(error);
    else toast.success("Welcome back");
  };
  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await signUp(email, password, fullName);
    setBusy(false);
    if (error) toast.error(error);
    else toast.success("Account created — check your email or sign in.");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-navy text-navy-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,oklch(0.72_0.13_195),transparent_50%),radial-gradient(circle_at_80%_70%,oklch(0.55_0.13_230),transparent_50%)]" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal text-teal-foreground grid place-items-center shadow-lg">
            <Anchor className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">MEKWORLD MARINES</div>
            <div className="text-xs text-navy-foreground/70 tracking-widest uppercase">ERP System</div>
          </div>
        </div>
        <div className="relative space-y-4 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Marine Processing & Exports Management System</h1>
          <p className="text-navy-foreground/70">
            End-to-end visibility from shrimp intake to global shipment — built for India's seafood exporters.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[
              ["Shrimp", "Processing"],
              ["Cold Chain", "Inventory"],
              ["Global", "Exports"],
            ].map(([a, b]) => (
              <div key={a} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-navy-foreground/60">{a}</div>
                <div className="text-sm font-semibold">{b}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-navy-foreground/50">© {new Date().getFullYear()} MekWorld Marines Pvt. Ltd.</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <div className="flex lg:hidden items-center gap-3 mb-6 justify-center">
            <div className="w-10 h-10 rounded-lg bg-navy text-navy-foreground grid place-items-center">
              <Anchor className="w-5 h-5" />
            </div>
            <div className="font-bold">MEKWORLD MARINES</div>
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mekworldmarines.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-navy hover:bg-navy-hover text-navy-foreground">
                  {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Sign in
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={onSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fn">Full name</Label>
                  <Input id="fn" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw2">Password</Label>
                  <Input id="pw2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-navy hover:bg-navy-hover text-navy-foreground">
                  {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Create account
                </Button>
                <p className="text-xs text-muted-foreground text-center">First registered user becomes Super Admin.</p>
              </form>
            </TabsContent>
          </Tabs>
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">← Back to dashboard</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
