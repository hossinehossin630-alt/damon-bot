import { useListAdmins, useAddAdmin, useRemoveAdmin, getListAdminsQueryKey } from "@workspace/api-client-react";
import { ShieldAlert, Trash2, Plus, UserPlus } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function Admins() {
  const { data: admins, isLoading } = useListAdmins();
  const addAdmin = useAddAdmin();
  const removeAdmin = useRemoveAdmin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [uid, setUid] = useState("");
  const [name, setName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !name) return;
    addAdmin.mutate({ data: { uid, name } }, {
      onSuccess: () => {
        toast({ title: "ADMIN_ADDED", description: `User ${name} granted admin privileges.` });
        setUid("");
        setName("");
        queryClient.invalidateQueries({ queryKey: getListAdminsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "ERROR", description: "Failed to add admin.", variant: "destructive" });
      }
    });
  };

  const handleRemove = (targetUid: string) => {
    if (!confirm(`REVOKE ADMIN ACCESS FOR UID: ${targetUid}?`)) return;
    removeAdmin.mutate({ uid: targetUid }, {
      onSuccess: () => {
        toast({ title: "ADMIN_REMOVED", description: `Access revoked for ${targetUid}.` });
        queryClient.invalidateQueries({ queryKey: getListAdminsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-widest text-primary flex items-center gap-3">
          <ShieldAlert className="w-6 h-6" /> ACCESS_CONTROL
        </h1>
        <div className="text-xs text-muted-foreground">MANAGE_SYSTEM_ADMINISTRATORS</div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border rounded-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <CardHeader className="border-b border-border/50 bg-black/20">
          <CardTitle className="text-sm text-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> GRANT_ACCESS
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
            <Input 
              placeholder="FACEBOOK_UID" 
              value={uid} 
              onChange={e => setUid(e.target.value)}
              className="bg-black/40 border-primary/30 text-primary font-mono focus-visible:ring-primary rounded-none"
              required
            />
            <Input 
              placeholder="ADMIN_ALIAS" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-black/40 border-primary/30 text-primary font-mono focus-visible:ring-primary rounded-none"
              required
            />
            <Button 
              type="submit" 
              className="rounded-none border border-primary text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground font-mono"
              disabled={addAdmin.isPending}
            >
              <Plus className="w-4 h-4 mr-2" /> ADD_RECORD
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-border rounded-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <CardHeader className="border-b border-border/50 bg-black/20">
          <CardTitle className="text-sm text-muted-foreground">ACTIVE_PERSONNEL</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-primary animate-pulse font-mono text-sm">FETCHING_RECORDS...</div>
          ) : !admins?.length ? (
            <div className="p-6 text-muted-foreground font-mono text-sm">NO_RECORDS_FOUND</div>
          ) : (
            <div className="divide-y divide-border/50">
              {admins.map(admin => (
                <div key={admin.uid} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-primary/5 transition-colors gap-4">
                  <div className="flex flex-col gap-1 font-mono">
                    <span className="text-primary font-bold">{admin.name}</span>
                    <span className="text-xs text-muted-foreground">UID: {admin.uid}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground/50 font-mono hidden md:inline">
                      AUTH_DATE: {format(new Date(admin.addedAt), "yyyy-MM-dd HH:mm")}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemove(admin.uid)}
                      disabled={removeAdmin.isPending}
                      className="text-destructive hover:bg-destructive/20 hover:text-destructive rounded-none border border-transparent hover:border-destructive/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
