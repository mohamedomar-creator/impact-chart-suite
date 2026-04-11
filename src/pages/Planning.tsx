import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Calendar, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Plan = { id: string; program: string; planned: string; trainer: string; status: string };
const emptyForm = { program: "", planned: "", trainer: "" };

const Planning = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["monthly_plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("monthly_plans").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Plan[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (vals: typeof form) => {
      const record = { program: vals.program, planned: vals.planned, trainer: vals.trainer, status: editItem?.status || "planned" };
      if (editItem) {
        const { error } = await supabase.from("monthly_plans").update(record).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("monthly_plans").insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["monthly_plans"] }); toast.success(editItem ? "تم التعديل" : "تم الإضافة"); closeDialog(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("monthly_plans").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["monthly_plans"] }); toast.success("تم الحذف"); setDeleteId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (p: Plan) => { setEditItem(p); setForm({ program: p.program, planned: p.planned, trainer: p.trainer }); setDialogOpen(true); };
  const openAdd = () => { setEditItem(null); setForm(emptyForm); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditItem(null); setForm(emptyForm); };

  const handleSubmit = () => {
    if (!form.program || !form.planned || !form.trainer) { toast.error("يرجى ملء جميع الحقول"); return; }
    upsert.mutate(form);
  };

  return (
    <DashboardLayout title="Monthly Planning" subtitle="Track planned vs delivered programs">
      <div className="space-y-6">
        <div className="flex justify-between">
          <div />
          <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Add Plan</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">Program</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Trainer</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Planned</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
                ) : plans.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد خطط</td></tr>
                ) : plans.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{p.program}</td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell">{p.trainer}</td>
                    <td className="p-4 text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{p.planned}</td>
                    <td className="p-4"><StatusBadge status={p.status} /></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? "تعديل الخطة" : "إضافة خطة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>اسم البرنامج</Label><Input value={form.program} onChange={e => setForm(f => ({ ...f, program: e.target.value }))} placeholder="مثال: برنامج القيادة" /></div>
            <div className="space-y-2"><Label>المدرب</Label><Input value={form.trainer} onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))} placeholder="مثال: Sarah Ahmed" /></div>
            <div className="space-y-2"><Label>الموعد المخطط</Label><Input value={form.planned} onChange={e => setForm(f => ({ ...f, planned: e.target.value }))} placeholder="مثال: Apr 2026" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={upsert.isPending}>{editItem ? "حفظ التعديل" : "إضافة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">هل أنت متأكد من حذف هذه الخطة؟</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMut.mutate(deleteId)} disabled={deleteMut.isPending}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Planning;
