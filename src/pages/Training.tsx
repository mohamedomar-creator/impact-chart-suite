import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Program = { id: string; name: string; trainer: string; audience: string; duration: string; enrolled: number; completed: number; completion_rate: number; status: string };
const emptyForm = { name: "", trainer: "", audience: "", duration: "", enrolled: "" };

const Training = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Program | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["training_programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("training_programs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Program[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (vals: typeof form) => {
      const record = { name: vals.name, trainer: vals.trainer, audience: vals.audience, duration: vals.duration, enrolled: parseInt(vals.enrolled), completed: 0, completion_rate: 0, status: "planned" };
      if (editItem) {
        const { error } = await supabase.from("training_programs").update({ name: vals.name, trainer: vals.trainer, audience: vals.audience, duration: vals.duration, enrolled: parseInt(vals.enrolled) }).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("training_programs").insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["training_programs"] }); toast.success(editItem ? "تم التعديل" : "تم الإضافة"); closeDialog(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("training_programs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["training_programs"] }); toast.success("تم الحذف"); setDeleteId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (p: Program) => { setEditItem(p); setForm({ name: p.name, trainer: p.trainer, audience: p.audience, duration: p.duration, enrolled: String(p.enrolled) }); setDialogOpen(true); };
  const openAdd = () => { setEditItem(null); setForm(emptyForm); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditItem(null); setForm(emptyForm); };

  const handleSubmit = () => {
    if (!form.name || !form.trainer || !form.audience || !form.duration || !form.enrolled) { toast.error("يرجى ملء جميع الحقول"); return; }
    upsert.mutate(form);
  };

  return (
    <DashboardLayout title="Training Management" subtitle="Track training programs and progress">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div />
          <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> New Program</Button>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
          ) : programs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد برامج تدريبية</p>
          ) : programs.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-heading font-semibold">{p.name}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Trainer: {p.trainer}</span>
                      <span>Audience: {p.audience}</span>
                      <span>Duration: {p.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 lg:w-96">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{p.completed}/{p.enrolled} completed</span>
                        <span>{p.completion_rate}%</span>
                      </div>
                      <Progress value={p.completion_rate} className="h-2" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? "تعديل البرنامج" : "إضافة برنامج تدريبي جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>اسم البرنامج</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: برنامج القيادة" /></div>
            <div className="space-y-2"><Label>المدرب</Label><Input value={form.trainer} onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))} /></div>
            <div className="space-y-2"><Label>الجمهور المستهدف</Label><Input value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>المدة</Label><Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="مثال: 4 weeks" /></div>
              <div className="space-y-2"><Label>عدد المسجلين</Label><Input type="number" value={form.enrolled} onChange={e => setForm(f => ({ ...f, enrolled: e.target.value }))} /></div>
            </div>
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
          <p className="text-sm text-muted-foreground">هل أنت متأكد من حذف هذا البرنامج؟</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMut.mutate(deleteId)} disabled={deleteMut.isPending}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Training;
