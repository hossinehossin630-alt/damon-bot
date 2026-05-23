import { useGetBotStatus, BotStatus, getGetBotStatusQueryKey } from "@workspace/api-client-react";
import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, Hash, Network, Users, Cookie } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Dashboard() {
  const { data: initialStatus } = useGetBotStatus({ query: { refetchInterval: 5000 } });
  const [localStatus, setLocalStatus] = useState<BotStatus | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialStatus) {
      setLocalStatus(initialStatus);
    }
  }, [initialStatus]);

  useEffect(() => {
    const handleStatus = (s: any) => {
      setLocalStatus(prev => {
        if (!prev) return s;
        return { ...prev, ...s };
      });
      // also update query client cache lightly
      queryClient.setQueryData(getGetBotStatusQueryKey(), (old: any) => {
        if (!old) return old;
        return { ...old, ...s };
      });
    };
    socket.on("bot-status", handleStatus);
    return () => {
      socket.off("bot-status", handleStatus);
    };
  }, [queryClient]);

  // Client-side uptime tick
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalStatus(prev => {
        if (!prev || !prev.online) return prev;
        return { ...prev, uptimeSeconds: prev.uptimeSeconds + 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!localStatus) {
    return <div className="text-primary animate-pulse flex items-center gap-2"><Activity className="animate-spin" /> INITIALIZING_TELEMETRY...</div>;
  }

  const metrics = [
    {
      title: "STATUS",
      value: localStatus.online ? "ONLINE" : "OFFLINE",
      icon: Activity,
      valueClass: localStatus.online ? "text-green-500 text-shadow-sm shadow-green-500" : "text-destructive text-shadow-sm shadow-destructive",
      borderClass: localStatus.online ? "border-green-500/30" : "border-destructive/30"
    },
    {
      title: "UPTIME",
      value: localStatus.online ? formatUptime(localStatus.uptimeSeconds) : "00:00:00",
      icon: Clock,
      valueClass: "text-primary text-shadow-sm shadow-primary",
      borderClass: "border-primary/30"
    },
    {
      title: "BOT_UID",
      value: localStatus.uid || "UNASSIGNED",
      icon: Hash,
      valueClass: "text-foreground",
      borderClass: "border-border"
    },
    {
      title: "CONNECTION",
      value: localStatus.connectionType || "DISCONNECTED",
      icon: Network,
      valueClass: localStatus.connectionType === "MQTT" ? "text-primary" : "text-muted-foreground",
      borderClass: "border-border"
    },
    {
      title: "ADMINS",
      value: localStatus.adminCount.toString(),
      icon: Users,
      valueClass: "text-foreground",
      borderClass: "border-border"
    },
    {
      title: "COOKIE",
      value: localStatus.cookieLoaded ? "LOADED" : "MISSING",
      icon: Cookie,
      valueClass: localStatus.cookieLoaded ? "text-green-500" : "text-destructive",
      borderClass: localStatus.cookieLoaded ? "border-green-500/30" : "border-destructive/30"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-widest text-primary flex items-center gap-3">
          <Activity className="w-6 h-6" /> SYSTEM_DASHBOARD
        </h1>
        <div className="text-xs text-muted-foreground">REAL_TIME_TELEMETRY_LINK_ESTABLISHED</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className={`bg-card/50 backdrop-blur border ${m.borderClass} rounded-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] overflow-hidden relative group`}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 bg-black/20">
              <CardTitle className="text-xs font-medium text-muted-foreground">{m.title}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className={`text-2xl font-bold font-mono tracking-wider ${m.valueClass}`}>
                {m.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {localStatus.name && (
        <div className="mt-8 p-4 border border-primary/20 bg-primary/5 flex items-center gap-4 text-sm font-mono">
          <span className="text-muted-foreground">IDENTITY:</span>
          <span className="text-primary">{localStatus.name}</span>
        </div>
      )}
    </div>
  );
}
