import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const activityTypes = ["Training Session", "Content Development", "LMS Management", "Coaching", "Meeting", "Reporting"];

type Activity = { id: string; title: string; type: string; user: string; duration: number; date: string; status: string };

const emptyForm = { title: "", type: "Training Session", user: "", duration: "", date: new Date().toISOString().split("T")[0] };

const Activities = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Activity | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as Activity[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (vals: typeof form) => {
      const record = { title: vals.title, type: vals.type, user: vals.user, duration: parseFloat(vals.duration), date: vals.date, status: "in-progress" };
      if (editItem) {
        const { error } = await supabase.from("activities").update(record).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("activities").insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["activities"] }); toast.success(editItem ? "تم التعديل" : "تم الإضافة"); closeDialog(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("activities").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["activities"] }); toast.success("تم الحذف"); setDeleteId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (a: Activity) => { setEditItem(a); setForm({ title: a.title, type: a.type, user: a.user, duration: String(a.duration), date: a.date }); setDialogOpen(true); };
  const openAdd = () => { setEditItem(null); setForm(emptyForm); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditItem(null); setForm(emptyForm); };

  const handleSubmit = () => {
    if (!form.title || !form.user || !form.duration) { toast.error("يرجى ملء جميع الحقول"); return; }
    upsert.mutate(form);
  };

  const filtered = activities.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <DashboardLayout title="Activity Tracking" subtitle="Log and monitor daily activities">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-3 flex-1">
            <Input placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {activityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Log Activity</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">Activity</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Team Member</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Duration</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">لا توجد أنشطة</td></tr>
                  ) : filtered.map(a => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium">{a.title}</td>
                      <td className="p-4 text-muted-foreground">{a.type}</td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{a.user}</td>
                      <td className="p-4 text-muted-foreground">{a.date}</td>
                      <td className="p-4">{a.duration}h</td>
                      <td className="p-4"><StatusBadge status={a.status} /></td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(a.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? "تعديل النشاط" : "تسجيل نشاط جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>عنوان النشاط</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثال: جلسة تدريب القيادة" /></div>
            <div className="space-y-2"><Label>النوع</Label><Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{activityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>اسم الموظف</Label><Input value={form.user} onChange={e => setForm(f => ({ ...f, user: e.target.value }))} placeholder="مثال: Sarah Ahmed" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>المدة (ساعات)</Label><Input type="number" min="0.5" step="0.5" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
              <div className="space-y-2"><Label>التاريخ</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={upsert.isPending}>{editItem ? "حفظ التعديل" : "إضافة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">هل أنت متأكد من حذف هذا النشاط؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMut.mutate(deleteId)} disabled={deleteMut.isPending}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Activities;
