import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, AlertTriangle, CalendarCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Activity = { id: string; title: string; type: string; user: string; duration: number; date: string; status: string; is_planned: boolean };

const emptyForm = { title: "", type: "Training Session", user: "", duration: "", date: new Date().toISOString().split("T")[0], is_planned: true };

const Activities = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [plannedFilter, setPlannedFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Activity | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [addTypeOpen, setAddTypeOpen] = useState(false);

  const { data: activityTypes = [] } = useQuery({
    queryKey: ["activity_types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_types").select("*").order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

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
      const record = { title: vals.title, type: vals.type, user: vals.user, duration: parseFloat(vals.duration), date: vals.date, status: "in-progress", is_planned: vals.is_planned };
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

  const addTypeMut = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("activity_types").insert({ name });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["activity_types"] }); toast.success("تمت إضافة النوع"); setNewTypeName(""); setAddTypeOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (a: Activity) => { setEditItem(a); setForm({ title: a.title, type: a.type, user: a.user, duration: String(a.duration), date: a.date, is_planned: a.is_planned }); setDialogOpen(true); };
  const openAdd = () => { setEditItem(null); setForm(emptyForm); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditItem(null); setForm(emptyForm); };

  const handleSubmit = () => {
    if (!form.title || !form.user || !form.duration) { toast.error("يرجى ملء جميع الحقول"); return; }
    upsert.mutate(form);
  };

  const filtered = activities.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.type === typeFilter;
    const matchPlanned = plannedFilter === "all" || (plannedFilter === "planned" ? a.is_planned : !a.is_planned);
    return matchSearch && matchType && matchPlanned;
  });

  const plannedCount = activities.filter(a => a.is_planned).length;
  const unplannedCount = activities.filter(a => !a.is_planned).length;

  return (
    <DashboardLayout title="Activity Tracking" subtitle="Log and monitor daily activities">
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPlannedFilter("all")}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-heading font-bold">{activities.length}</p>
              <p className="text-xs text-muted-foreground">إجمالي الأنشطة</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/30" onClick={() => setPlannedFilter("planned")}>
            <CardContent className="p-4 text-center">
              <CalendarCheck className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-heading font-bold text-primary">{plannedCount}</p>
              <p className="text-xs text-muted-foreground">مخطط لها</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-amber-500/30" onClick={() => setPlannedFilter("unplanned")}>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-heading font-bold text-amber-600">{unplannedCount}</p>
              <p className="text-xs text-muted-foreground">غير مخطط (مفاجئة)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-heading font-bold">{activities.length > 0 ? Math.round((unplannedCount / activities.length) * 100) : 0}%</p>
              <p className="text-xs text-muted-foreground">نسبة المفاجئة</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-3 flex-1 flex-wrap">
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="كل الأنواع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {activityTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={plannedFilter} onValueChange={setPlannedFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="planned">مخطط لها</SelectItem>
                <SelectItem value="unplanned">غير مخطط</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddTypeOpen(true)}>+ نوع جديد</Button>
            <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> تسجيل نشاط</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-right p-4 font-medium text-muted-foreground">النشاط</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">النوع</th>
                    <th className="text-right p-4 font-medium text-muted-foreground hidden sm:table-cell">الموظف</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">التاريخ</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">المدة</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">التخطيط</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">لا توجد أنشطة</td></tr>
                  ) : filtered.map(a => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium">{a.title}</td>
                      <td className="p-4 text-muted-foreground">{a.type}</td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{a.user}</td>
                      <td className="p-4 text-muted-foreground">{a.date}</td>
                      <td className="p-4">{a.duration}h</td>
                      <td className="p-4">
                        {a.is_planned ? (
                          <Badge variant="outline" className="text-primary border-primary/40 gap-1"><CalendarCheck className="h-3 w-3" />مخطط</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-400/40 gap-1"><AlertTriangle className="h-3 w-3" />مفاجئ</Badge>
                        )}
                      </td>
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
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activityTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>اسم الموظف</Label><Input value={form.user} onChange={e => setForm(f => ({ ...f, user: e.target.value }))} placeholder="مثال: Sarah Ahmed" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>المدة (ساعات)</Label><Input type="number" min="0.5" step="0.5" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
              <div className="space-y-2"><Label>التاريخ</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="font-medium">نشاط مخطط له؟</Label>
                <p className="text-xs text-muted-foreground mt-0.5">أغلق إذا كان النشاط مفاجئ / غير مجدول</p>
              </div>
              <Switch checked={form.is_planned} onCheckedChange={v => setForm(f => ({ ...f, is_planned: v }))} />
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

      {/* Add New Type Dialog */}
      <Dialog open={addTypeOpen} onOpenChange={setAddTypeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة نوع نشاط جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>اسم النوع</Label>
              <Input value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="مثال: Workshop" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTypeOpen(false)}>إلغاء</Button>
            <Button onClick={() => { if (!newTypeName.trim()) { toast.error("أدخل اسم النوع"); return; } addTypeMut.mutate(newTypeName.trim()); }} disabled={addTypeMut.isPending}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Activities;
