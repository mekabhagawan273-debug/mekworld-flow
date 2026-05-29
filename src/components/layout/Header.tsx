import { Bell, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function Header({ onMenu }: { onMenu: () => void }) {
  const { user, signOut } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-card/95 backdrop-blur flex items-center px-4 lg:px-6 gap-3">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
        <Menu className="w-5 h-5" />
      </Button>
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search modules, batches, suppliers..." className="pl-9 bg-secondary border-0 h-9" />
        </div>
      </div>
      <div className="flex-1 md:hidden" />
      <div className="hidden sm:flex flex-col items-end mr-2 leading-tight">
        <span className="text-xs text-muted-foreground">{format(new Date(), "EEEE")}</span>
        <span className="text-sm font-semibold">{format(new Date(), "dd MMM yyyy")}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={toggleDark}>
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-destructive text-destructive-foreground text-[10px]">
              3
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex-col items-start gap-1 py-3">
            <span className="font-medium text-sm">Low stock alert</span>
            <span className="text-xs text-muted-foreground">Packing cartons below minimum · 2h ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex-col items-start gap-1 py-3">
            <span className="font-medium text-sm">QC rejection</span>
            <span className="text-xs text-muted-foreground">Batch BATCH-20260529-A12 rejected · 5h ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex-col items-start gap-1 py-3">
            <span className="font-medium text-sm">Cold storage temperature</span>
            <span className="text-xs text-muted-foreground">Chamber 2 above -18°C · 1d ago</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">
              {user?.email?.[0].toUpperCase() ?? "U"}
            </div>
            <span className="hidden sm:inline text-sm font-medium max-w-[140px] truncate">{user?.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Signed in</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive">
            <LogOut className="w-4 h-4 mr-2" />Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
