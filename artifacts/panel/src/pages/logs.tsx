import { useGetLogs, LogEntry } from "@workspace/api-client-react";
import { TerminalSquare, Filter } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { socket } from "@/lib/socket";
import { format } from "date-fns";

const LEVEL_COLORS: Record<string, string> = {
  INFO: "text-cyan-400",
  WARN: "text-yellow-400",
  ERROR: "text-red-500",
  OK: "text-green-500"
};

export default function Logs() {
  const { data: initialLogs, isLoading } = useGetLogs({ limit: 100 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (initialLogs) {
      setLogs(initialLogs);
    }
  }, [initialLogs]);

  useEffect(() => {
    const handleLog = (newLog: LogEntry) => {
      setLogs(prev => {
        const updated = [newLog, ...prev];
        if (updated.length > 500) updated.pop(); // Keep bounded
        return updated;
      });
    };
    socket.on("log", handleLog);
    return () => {
      socket.off("log", handleLog);
    };
  }, []);

  // Because logs are prepended (newest first), if we want terminal style, we display newest at bottom and auto-scroll to bottom.
  // Wait, the API might return newest first. Let's render reversed so newest is at the bottom.
  const displayLogs = [...logs].reverse().filter(l => 
    !filter || 
    l.level.toLowerCase().includes(filter.toLowerCase()) || 
    l.tag.toLowerCase().includes(filter.toLowerCase()) || 
    l.message.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayLogs, autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setAutoScroll(isAtBottom);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-widest text-primary flex items-center gap-3">
            <TerminalSquare className="w-6 h-6" /> SYSTEM_LOGS
          </h1>
          <div className="text-xs text-muted-foreground">REAL_TIME_EVENT_STREAM</div>
        </div>
        
        <div className="flex items-center gap-2 bg-black/40 border border-primary/30 p-1 px-3">
          <Filter className="w-4 h-4 text-primary/50" />
          <input 
            type="text" 
            placeholder="FILTER_STREAM..." 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-primary font-mono text-sm w-full md:w-48 placeholder:text-primary/30 focus:ring-0"
          />
        </div>
      </div>

      <div className="flex-1 bg-black/60 border border-border relative overflow-hidden flex flex-col font-mono text-sm shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none" />
        
        {isLoading && !logs.length ? (
          <div className="p-4 text-primary animate-pulse">ESTABLISHING_STREAM_CONNECTION...</div>
        ) : (
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar pb-12"
          >
            {displayLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 group hover:bg-white/5 py-0.5 px-2 -mx-2 transition-colors">
                <span className="text-muted-foreground/50 shrink-0 select-none">
                  {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                </span>
                <span className={`w-12 shrink-0 font-bold ${LEVEL_COLORS[log.level] || "text-primary"}`}>
                  {log.level}
                </span>
                <span className="text-primary/70 shrink-0 w-24 truncate" title={log.tag}>
                  [{log.tag}]
                </span>
                <span className="text-foreground break-all">
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {!autoScroll && (
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <button 
              onClick={() => {
                setAutoScroll(true);
                if (containerRef.current) {
                  containerRef.current.scrollTop = containerRef.current.scrollHeight;
                }
              }}
              className="bg-primary/20 border border-primary text-primary px-4 py-1 text-xs backdrop-blur hover:bg-primary hover:text-black transition-colors"
            >
              RESUME_AUTO_SCROLL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
