import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, ChevronDown, ChevronRight, Link2, Unlink } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  job_role: string | null;
  manager_id: string | null;
  avatar_url: string | null;
};

type TreeNode = Profile & { children: TreeNode[] };

function buildTree(profiles: Profile[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  profiles.forEach(p => map.set(p.user_id, { ...p, children: [] }));

  const roots: TreeNode[] = [];
  profiles.forEach(p => {
    const node = map.get(p.user_id)!;
    if (p.manager_id && map.has(p.manager_id)) {
      map.get(p.manager_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function OrgNode({ node, level, onEdit }: { node: TreeNode; level: number; onEdit: (p: Profile) => void }) {
  const [expanded, setExpanded] = useState(level < 2);
  const initials = (node.display_name || "?").split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const hasChildren = node.children.length > 0;

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
        style={{ paddingRight: `${level * 24 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : <div className="w-4" />}
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{node.display_name || "بدون اسم"}</p>
          <p className="text-xs text-muted-foreground truncate">{node.job_role || "—"}</p>
        </div>
        {hasChildren && <Badge variant="secondary" className="text-xs">{node.children.length}</Badge>}
        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-7 text-xs" onClick={e => { e.stopPropagation(); onEdit(node); }}>
          <Link2 className="h-3 w-3 mr-1" /> تعديل
        </Button>
      </div>
      {expanded && node.children.map(child => (
        <OrgNode key={child.user_id} node={child} level={level + 1} onEdit={onEdit} />
      ))}
    </div>
  );
}

export default function OrgChart() {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [newManagerId, setNewManagerId] = useState<string>("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles-org"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const tree = buildTree(profiles);

  const updateMut = useMutation({
    mutationFn: async ({ userId, managerId }: { userId: string; managerId: string | null }) => {
      const { error } = await supabase.from("profiles").update({ manager_id: managerId }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles-org"] });
      toast.success("تم تحديث الهيكل التنظيمي");
      setEditOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleEdit = (p: Profile) => {
    setEditProfile(p);
    setNewManagerId(p.manager_id || "none");
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!editProfile) return;
    const managerId = newManagerId === "none" ? null : newManagerId;
    if (managerId === editProfile.user_id) {
      toast.error("لا يمكن أن يكون الموظف مديراً لنفسه");
      return;
    }
    updateMut.mutate({ userId: editProfile.user_id, managerId });
  };

  return (
    <DashboardLayout title="الهيكل التنظيمي" subtitle="إدارة التسلسل الهرمي وربط الموظفين بمديريهم">
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{profiles.length}</p><p className="text-xs text-muted-foreground">إجمالي الموظفين</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Link2 className="h-5 w-5 mx-auto text-success mb-1" /><p className="text-2xl font-bold">{profiles.filter(p => p.manager_id).length}</p><p className="text-xs text-muted-foreground">مرتبطون بمدير</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Unlink className="h-5 w-5 mx-auto text-warning mb-1" /><p className="text-2xl font-bold">{profiles.filter(p => !p.manager_id).length}</p><p className="text-xs text-muted-foreground">بدون مدير (جذر)</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-heading">شجرة الهيكل التنظيمي</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground p-8">جاري التحميل...</p>
            ) : profiles.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">لا يوجد موظفون بعد</p>
            ) : (
              <div className="space-y-0.5">
                {tree.map(node => <OrgNode key={node.user_id} node={node} level={0} onEdit={handleEdit} />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعديل المدير المباشر</DialogTitle></DialogHeader>
          {editProfile && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-muted-foreground text-xs">الموظف</Label>
                <p className="font-medium">{editProfile.display_name}</p>
              </div>
              <div className="space-y-2">
                <Label>المدير المباشر</Label>
                <Select value={newManagerId} onValueChange={setNewManagerId}>
                  <SelectTrigger><SelectValue placeholder="اختر المدير" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مدير (جذر)</SelectItem>
                    {profiles.filter(p => p.user_id !== editProfile.user_id).map(p => (
                      <SelectItem key={p.user_id} value={p.user_id}>{p.display_name || p.user_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={updateMut.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
