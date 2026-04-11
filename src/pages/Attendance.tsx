import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, LogIn, LogOut, UserCheck, UserX, Timer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const KpiCard = ({ title, value, icon: Icon, subtitle }: { title: string; value: string | number; icon: React.ElementType; subtitle?: string }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-heading font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

function getStatusBadge(status: string) {
  switch (status) {
    case "present": return <Badge className="bg-success/15 text-success border-success/30">حاضر</Badge>;
    case "late": return <Badge className="bg-warning/15 text-warning border-warning/30">متأخر</Badge>;
    case "absent": return <Badge className="bg-destructive/15 text-destructive border-destructive/30">غائب</Badge>;
    case "leave": return <Badge className="bg-info/15 text-info border-info/30">إجازة</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

type AttendanceRecord = { id: string; name: string; role: string; avatar: string; date: string; check_in: string | null; check_out: string | null; hours_worked: number | null; status: string };

export default function Attendance() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const now = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance", today],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance_records").select("*").eq("date", today).order("created_at");
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });

  const presentCount = records.filter(r => r.status === "present" || r.status === "late").length;
  const absentCount = records.filter(r => r.status === "absent").length;
  const lateCount = records.filter(r => r.status === "late").length;
  const avgHours = records.filter(r => r.hours_worked).reduce((sum, r) => sum + (r.hours_worked || 0), 0) / (presentCount || 1);

  const checkInMut = useMutation({
    mutationFn: async () => {
      const name = selectedEmployee || employeeName;
      if (!name) throw new Error("اختر أو أدخل اسم الموظف");
      const time = now();
      const isLate = time > "08:15";
      const existing = records.find(r => r.name === name);
      if (existing?.check_in) throw new Error("هذا الموظف سجل حضور بالفعل");

      if (existing) {
        const { error } = await supabase.from("attendance_records").update({ check_in: time, status: isLate ? "late" : "present" }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("attendance_records").insert({ name, role: employeeRole || "موظف", avatar: name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase(), date: today, check_in: time, status: isLate ? "late" : "present" });
        if (error) throw error;
      }
      return { name, time };
    },
    onSuccess: ({ name, time }) => { queryClient.invalidateQueries({ queryKey: ["attendance"] }); toast.success(`تم تسجيل حضور ${name} في ${time}`); setCheckInOpen(false); setSelectedEmployee(""); setEmployeeName(""); setEmployeeRole(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const checkOutMut = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) throw new Error("اختر الموظف");
      const existing = records.find(r => r.name === selectedEmployee);
      if (!existing?.check_in) throw new Error("هذا الموظف لم يسجل حضور بعد");
      if (existing.check_out) throw new Error("هذا الموظف سجل انصراف بالفعل");

      const time = now();
      const [inH, inM] = existing.check_in.split(":").map(Number);
      const [outH, outM] = time.split(":").map(Number);
      const hours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 10) / 10;

      const { error } = await supabase.from("attendance_records").update({ check_out: time, hours_worked: hours }).eq("id", existing.id);
      if (error) throw error;
      return { name: selectedEmployee, time, hours };
    },
    onSuccess: ({ name, time, hours }) => { queryClient.invalidateQueries({ queryKey: ["attendance"] }); toast.success(`تم تسجيل انصراف ${name} في ${time} (${hours} ساعة)`); setCheckOutOpen(false); setSelectedEmployee(""); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout title="تسجيل الحضور والانصراف" subtitle="متابعة حضور وانصراف فريق العمل">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="الحاضرون اليوم" value={presentCount} icon={UserCheck} subtitle={`من ${records.length} موظف`} />
          <KpiCard title="الغائبون" value={absentCount} icon={UserX} subtitle="بدون إجازة" />
          <KpiCard title="المتأخرون" value={lateCount} icon={Clock} subtitle="وصول بعد الموعد" />
          <KpiCard title="متوسط ساعات العمل" value={`${avgHours.toFixed(1)} ساعة`} icon={Timer} />
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-heading">إجراءات سريعة</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2" onClick={() => setCheckInOpen(true)}><LogIn className="h-4 w-4" /> تسجيل حضور</Button>
              <Button variant="outline" className="gap-2" onClick={() => setCheckOutOpen(true)}><LogOut className="h-4 w-4" /> تسجيل انصراف</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading">سجل الحضور - اليوم</CardTitle>
              <Badge variant="secondary">{today}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">وقت الحضور</TableHead>
                  <TableHead className="text-right">وقت الانصراف</TableHead>
                  <TableHead className="text-right">ساعات العمل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">لا توجد سجلات حضور لهذا اليوم</td></tr>
                ) : records.map(record => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 text-primary text-xs">{record.avatar}</AvatarFallback></Avatar>
                        <span className="font-medium text-sm">{record.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{record.role}</TableCell>
                    <TableCell className="text-sm">{record.check_in || "—"}</TableCell>
                    <TableCell className="text-sm">{record.check_out || "—"}</TableCell>
                    <TableCell className="text-sm">{record.hours_worked ? `${record.hours_worked} ساعة` : "—"}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تسجيل حضور</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {records.length > 0 && (
              <Select value={selectedEmployee} onValueChange={v => { setSelectedEmployee(v); setEmployeeName(""); }}>
                <SelectTrigger><SelectValue placeholder="اختر موظف موجود" /></SelectTrigger>
                <SelectContent>{records.filter(r => !r.check_in).map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <div className="space-y-2"><Label>أو أدخل اسم جديد</Label><Input value={employeeName} onChange={e => { setEmployeeName(e.target.value); setSelectedEmployee(""); }} placeholder="اسم الموظف" /></div>
            <div className="space-y-2"><Label>الدور الوظيفي</Label><Input value={employeeRole} onChange={e => setEmployeeRole(e.target.value)} placeholder="مثال: L&D Specialist" /></div>
            <p className="text-sm text-muted-foreground">الوقت الحالي: <span className="font-medium text-foreground">{now()}</span></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInOpen(false)}>إلغاء</Button>
            <Button onClick={() => checkInMut.mutate()} disabled={checkInMut.isPending} className="gap-2"><LogIn className="h-4 w-4" /> تسجيل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={checkOutOpen} onOpenChange={setCheckOutOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تسجيل انصراف</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
              <SelectContent>{records.filter(r => r.check_in && !r.check_out).map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">الوقت الحالي: <span className="font-medium text-foreground">{now()}</span></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckOutOpen(false)}>إلغاء</Button>
            <Button onClick={() => checkOutMut.mutate()} disabled={checkOutMut.isPending} className="gap-2"><LogOut className="h-4 w-4" /> تسجيل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
