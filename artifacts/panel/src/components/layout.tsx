import { Link, useLocation } from "wouter";
import { Activity, ShieldAlert, Cookie, TerminalSquare, Cpu, Power, PowerOff } from "lucide-react";
import { useGetBotStatus, useReloadBot, getGetBotStatusQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: status } = useGetBotStatus({ query: { refetchInterval: 5000 } });
  const reloadBot = useReloadBot();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const handleReload = () => {
      toast({
        title: "Bot Reloaded",
        description: "The bot session was hot-reloaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
    };

    socket.on("bot-reload", handleReload);
    return () => {
      socket.off("bot-reload", handleReload);
    };
  }, [queryClient, toast]);

  const navItems = [
    { href: "/", label: "DASHBOARD", icon: Activity },
    { href: "/admins", label: "ADMINS", icon: ShieldAlert },
    { href: "/cookie", label: "COOKIE", icon: Cookie },
    { href: "/logs", label: "LIVE LOGS", icon: TerminalSquare },
  ];

  const handleManualReload = () => {
    reloadBot.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Reload initiated", description: "Waiting for bot response..." });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row w-full bg-background dark text-foreground selection:bg-primary selection:text-primary-foreground font-mono uppercase tracking-wider">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Cpu className="w-6 h-6" />
            <span className="text-xl font-bold tracking-widest text-shadow-sm shadow-primary">DAMON_OS</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${status?.online ? "bg-green-500 shadow-green-500" : "bg-destructive shadow-destructive"}`} />
            <span className={status?.online ? "text-green-500" : "text-destructive"}>
              {status?.online ? "SYS_ONLINE" : "SYS_OFFLINE"}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer border border-transparent transition-all duration-200 hover:bg-accent hover:text-accent-foreground ${active ? "bg-accent/50 text-primary border-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]" : "text-muted-foreground"}`}>
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full font-mono border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-[0_0_10px_rgba(0,255,255,0.1)] hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all"
            onClick={handleManualReload}
            disabled={reloadBot.isPending}
          >
            <Power className="w-4 h-4 mr-2" />
            {reloadBot.isPending ? "RELOADING..." : "HOT_RELOAD"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="relative z-10 flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
