import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Building2, Home, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type EmployeeSetting = {
  id: string; employee_name: string; daily_hours: number; ramadan_hours: number;
  work_type: string; office_days: string[]; remote_days: string[];
  is_always_remote: boolean; break_hours: number;
};

const allDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const dayLabels: Record<string, string> = {
  Saturday: "السبت", Sunday: "الأحد", Monday: "الاثنين",
  Tuesday: "الثلاثاء", Wednesday: "الأربعاء", Thursday: "الخميس", Friday: "الجمعة"
};

const defaultForm = {
  employee_name: "", daily_hours: "8", ramadan_hours: "6", work_type: "full-time",
  office_days: ["Sunday", "Monday", "Tuesday", "Wednesday"],
  remote_days: ["Saturday", "Thursday"],
  is_always_remote: false, break_hours: "1",
};

export default function EmployeeSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EmployeeSetting | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["employee_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employee_settings").select("*").order("employee_name");
      if (error) throw error;
      return data as EmployeeSetting[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (vals: typeof form) => {
      const record = {
        employee_name: vals.employee_name,
        daily_hours: parseFloat(vals.daily_hours),
        ramadan_hours: parseFloat(vals.ramadan_hours),
        work_type: vals.work_type,
        office_days: vals.is_always_remote ? [] : vals.office_days,
        remote_days: vals.is_always_remote ? allDays : vals.remote_days,
        is_always_remote: vals.is_always_remote,
        break_hours: parseFloat(vals.break_hours),
      };
      if (editItem) {
        const { error } = await supabase.from("employee_settings").update(record).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employee_settings").insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_settings"] });
      toast.success(editItem ? "تم التعديل" : "تم الإضافة");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employee_settings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_settings"] });
      toast.success("تم الحذف"); setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (s: EmployeeSetting) => {
    setEditItem(s);
    setForm({
      employee_name: s.employee_name,
      daily_hours: String(s.daily_hours),
      ramadan_hours: String(s.ramadan_hours),
      work_type: s.work_type,
      office_days: s.office_days || [],
      remote_days: s.remote_days || [],
      is_always_remote: s.is_always_remote,
      break_hours: String(s.break_hours),
    });
    setDialogOpen(true);
  };

  const openAdd = () => { setEditItem(null); setForm(defaultForm); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditItem(null); setForm(defaultForm); };

  const toggleDay = (day: string, field: "office_days" | "remote_days") => {
    setForm(f => {
      const current = f[field];
      const other = field === "office_days" ? "remote_days" : "office_days";
      if (current.includes(day)) {
        return { ...f, [field]: current.filter(d => d !== day) };
      } else {
        return { ...f, [field]: [...current, day], [other]: f[other].filter(d => d !== day) };
      }
    });
  };

  const handleSubmit = () => {
    if (!form.employee_name) { toast.error("أدخل اسم الموظف"); return; }
    upsert.mutate(form);
  };

  return (
    <DashboardLayout title="إعدادات الموظفين" subtitle="جدول عمل مخصص لكل موظف">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            الجدول الافتراضي: الأحد-الأربعاء من المكتب، السبت والخميس عن بعد، الجمعة إجازة
          </p>
          <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> إضافة موظف</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">نوع الدوام</TableHead>
                  <TableHead className="text-right">الساعات</TableHead>
                  <TableHead className="text-right">ساعات رمضان</TableHead>
                  <TableHead className="text-right">أيام المكتب</TableHead>
                  <TableHead className="text-right">أيام الريموت</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>
                ) : settings.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">لا توجد إعدادات - سيتم استخدام الجدول الافتراضي</TableCell></TableRow>
                ) : settings.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.employee_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {s.is_always_remote ? "ريموت دائم" : s.work_type === "full-time" ? "دوام كامل" : "دوام جزئي"}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.daily_hours} ساعة ({s.break_hours}h بريك)</TableCell>
                    <TableCell>{s.ramadan_hours} ساعة</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.is_always_remote ? <span className="text-xs text-muted-foreground">—</span> :
                          (s.office_days || []).map(d => (
                            <Badge key={d} variant="secondary" className="text-xs gap-1"><Building2 className="h-3 w-3" />{dayLabels[d]}</Badge>
                          ))
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(s.remote_days || []).map(d => (
                          <Badge key={d} variant="outline" className="text-xs gap-1 text-purple-600 border-purple-300"><Home className="h-3 w-3" />{dayLabels[d]}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? "تعديل إعدادات الموظف" : "إضافة إعدادات موظف"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>اسم الموظف</Label>
              <Input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} placeholder="مثال: Sarah Ahmed" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع الدوام</Label>
                <Select value={form.work_type} onValueChange={v => setForm(f => ({ ...f, work_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">دوام كامل</SelectItem>
                    <SelectItem value="part-time">دوام جزئي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ساعات البريك</Label>
                <Input type="number" min="0" step="0.5" value={form.break_hours} onChange={e => setForm(f => ({ ...f, break_hours: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ساعات العمل اليومية</Label>
                <Input type="number" min="1" step="0.5" value={form.daily_hours} onChange={e => setForm(f => ({ ...f, daily_hours: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>ساعات العمل في رمضان</Label>
                <Input type="number" min="1" step="0.5" value={form.ramadan_hours} onChange={e => setForm(f => ({ ...f, ramadan_hours: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="font-medium">ريموت دائم؟</Label>
                <p className="text-xs text-muted-foreground mt-0.5">الموظف يعمل عن بعد كل الأيام</p>
              </div>
              <Switch checked={form.is_always_remote} onCheckedChange={v => setForm(f => ({ ...f, is_always_remote: v }))} />
            </div>

            {!form.is_always_remote && (
              <>
                <div className="space-y-2">
                  <Label>أيام المكتب 🏢</Label>
                  <div className="flex flex-wrap gap-2">
                    {allDays.map(day => (
                      <Button
                        key={day} type="button" size="sm"
                        variant={form.office_days.includes(day) ? "default" : "outline"}
                        onClick={() => toggleDay(day, "office_days")}
                      >
                        {dayLabels[day]}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>أيام الريموت 🏠</Label>
                  <div className="flex flex-wrap gap-2">
                    {allDays.map(day => (
                      <Button
                        key={day} type="button" size="sm"
                        variant={form.remote_days.includes(day) ? "secondary" : "outline"}
                        onClick={() => toggleDay(day, "remote_days")}
                        className={form.remote_days.includes(day) ? "text-purple-600" : ""}
                      >
                        {dayLabels[day]}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">📌 يوم الجمعة إجازة أسبوعية لجميع الموظفين</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={upsert.isPending}>{editItem ? "حفظ التعديل" : "إضافة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">هل أنت متأكد من حذف إعدادات هذا الموظف؟</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMut.mutate(deleteId)} disabled={deleteMut.isPending}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
