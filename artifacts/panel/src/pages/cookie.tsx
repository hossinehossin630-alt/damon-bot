import { useGetCookie, useUpdateCookie, getGetCookieQueryKey, getGetBotStatusQueryKey } from "@workspace/api-client-react";
import { Cookie, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { socket } from "@/lib/socket";

export default function CookieManager() {
  const { data: cookieInfo, isLoading } = useGetCookie();
  const updateCookie = useUpdateCookie();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cookieInput, setCookieInput] = useState("");

  useEffect(() => {
    const handleCookieReloaded = () => {
      queryClient.invalidateQueries({ queryKey: getGetCookieQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
    };
    socket.on("cookie-reloaded", handleCookieReloaded);
    return () => {
      socket.off("cookie-reloaded", handleCookieReloaded);
    };
  }, [queryClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cookieInput.trim()) return;

    try {
      // Validate it's JSON array
      const parsed = JSON.parse(cookieInput);
      if (!Array.isArray(parsed)) {
        throw new Error("Cookie must be a JSON array (c3c format)");
      }
      
      updateCookie.mutate({ data: { cookie: cookieInput } }, {
        onSuccess: () => {
          toast({ title: "STATE_UPDATED", description: "Cookie payload injected successfully." });
          setCookieInput("");
          queryClient.invalidateQueries({ queryKey: getGetCookieQueryKey() });
        },
        onError: () => {
          toast({ title: "INJECTION_FAILED", description: "Failed to update cookie state.", variant: "destructive" });
        }
      });
    } catch (err: any) {
      toast({ title: "PARSE_ERROR", description: err.message || "Invalid JSON format.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-widest text-primary flex items-center gap-3">
          <Cookie className="w-6 h-6" /> SESSION_STATE
        </h1>
        <div className="text-xs text-muted-foreground">MANAGE_AUTHENTICATION_PAYLOAD</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur border-border rounded-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
          <CardHeader className="border-b border-border/50 bg-black/20">
            <CardTitle className="text-sm text-muted-foreground">CURRENT_PAYLOAD_STATUS</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col gap-4 font-mono">
            {isLoading ? (
              <div className="animate-pulse text-primary text-sm">SCANNING...</div>
            ) : cookieInfo ? (
              <>
                <div className="flex items-center gap-3 p-4 border border-border bg-black/20">
                  {cookieInfo.loaded ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  )}
                  <div className="flex flex-col">
                    <span className={`text-lg font-bold tracking-widest ${cookieInfo.loaded ? "text-green-500" : "text-destructive"}`}>
                      {cookieInfo.loaded ? "PAYLOAD_ACTIVE" : "PAYLOAD_MISSING"}
                    </span>
                    {cookieInfo.updatedAt && (
                      <span className="text-xs text-muted-foreground">
                        LAST_UPDATE: {format(new Date(cookieInfo.updatedAt), "yyyy-MM-dd HH:mm:ss")}
                      </span>
                    )}
                  </div>
                </div>

                {cookieInfo.preview && (
                  <div className="flex-1 border border-border/50 bg-black/40 p-4 overflow-auto">
                    <div className="text-xs text-muted-foreground mb-2">PREVIEW_HASH:</div>
                    <pre className="text-xs text-primary/70 break-all whitespace-pre-wrap">
                      {cookieInfo.preview}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="text-destructive">ERROR_FETCHING_STATE</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border rounded-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <CardHeader className="border-b border-border/50 bg-black/20">
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <Upload className="w-4 h-4" /> INJECT_NEW_PAYLOAD
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="text-xs text-muted-foreground font-mono">
                EXPECTED_FORMAT: C3C_JSON_ARRAY
              </div>
              <Textarea 
                placeholder="[{...}, {...}]" 
                value={cookieInput}
                onChange={e => setCookieInput(e.target.value)}
                className="min-h-[300px] bg-black/40 border-primary/30 text-primary font-mono focus-visible:ring-primary rounded-none resize-y"
                required
              />
              <Button 
                type="submit" 
                className="rounded-none border border-primary text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground font-mono self-end w-full md:w-auto"
                disabled={updateCookie.isPending || !cookieInput.trim()}
              >
                <Upload className="w-4 h-4 mr-2" /> EXECUTE_INJECTION
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
