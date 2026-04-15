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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, LogIn, LogOut, UserCheck, UserX, Timer, CalendarOff, Home, Building2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const DAILY_HOURS = 8;
const RAMADAN_HOURS = 6;
const BREAK_HOURS = 1;

type AttendanceRecord = {
  id: string; name: string; role: string; avatar: string; date: string;
  check_in: string | null; check_out: string | null; hours_worked: number | null;
  status: string; leave_type: string | null; work_location: string | null;
};

const leaveTypes = [
  { value: "weekly", label: "إجازة أسبوعية (جمعة)" },
  { value: "government", label: "إجازة حكومية" },
  { value: "sick", label: "إجازة مرضية" },
  { value: "annual", label: "إجازة سنوية" },
  { value: "emergency", label: "إجازة طارئة" },
  { value: "other", label: "أخرى" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "present": return <Badge className="bg-success/15 text-success border-success/30">حاضر</Badge>;
    case "late": return <Badge className="bg-warning/15 text-warning border-warning/30">متأخر</Badge>;
    case "absent": return <Badge className="bg-destructive/15 text-destructive border-destructive/30">غائب</Badge>;
    case "leave": return <Badge className="bg-info/15 text-info border-info/30">إجازة</Badge>;
    case "remote": return <Badge className="bg-purple-500/15 text-purple-600 border-purple-400/30">عن بعد</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

function getLocationBadge(loc: string | null) {
  if (loc === "remote") return <Badge variant="outline" className="gap-1 text-purple-600 border-purple-300"><Home className="h-3 w-3" />عن بعد</Badge>;
  if (loc === "office") return <Badge variant="outline" className="gap-1 text-primary border-primary/30"><Building2 className="h-3 w-3" />من المكتب</Badge>;
  return null;
}

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

export default function Attendance() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const now = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");
  const [workLocation, setWorkLocation] = useState("office");
  const [leaveType, setLeaveType] = useState("annual");
  const [leaveDate, setLeaveDate] = useState(today);
  const [leaveName, setLeaveName] = useState("");
  const [leaveRole, setLeaveRole] = useState("");
  const [isRamadan, setIsRamadan] = useState(false);

  const maxHours = isRamadan ? RAMADAN_HOURS : DAILY_HOURS;

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance", today],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance_records").select("*").eq("date", today).order("created_at");
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });

  // Check for overtime alerts
  useEffect(() => {
    records.forEach(r => {
      if (r.hours_worked && r.hours_worked > maxHours) {
        toast.warning(`⚠️ ${r.name} تجاوز الحد المسموح (${r.hours_worked} ساعة من ${maxHours})`, { id: `overtime-${r.id}`, duration: 10000 });
      }
    });
  }, [records, maxHours]);

  const presentCount = records.filter(r => ["present", "late", "remote"].includes(r.status)).length;
  const absentCount = records.filter(r => r.status === "absent").length;
  const leaveCount = records.filter(r => r.status === "leave").length;
  const remoteCount = records.filter(r => r.work_location === "remote").length;
  const officeCount = records.filter(r => r.work_location === "office" && ["present", "late"].includes(r.status)).length;
  const avgHours = records.filter(r => r.hours_worked).reduce((sum, r) => sum + (r.hours_worked || 0), 0) / (presentCount || 1);
  const overtimeCount = records.filter(r => r.hours_worked && r.hours_worked > maxHours).length;

  const checkInMut = useMutation({
    mutationFn: async () => {
      const name = selectedEmployee || employeeName;
      if (!name) throw new Error("اختر أو أدخل اسم الموظف");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");
      const time = now();
      const isLate = time > "08:15";
      const existing = records.find(r => r.name === name);
      if (existing?.check_in) throw new Error("هذا الموظف سجل حضور بالفعل");

      const status = workLocation === "remote" ? "remote" : (isLate ? "late" : "present");

      if (existing) {
        const { error } = await supabase.from("attendance_records").update({ check_in: time, status, work_location: workLocation }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("attendance_records").insert({
          name, role: employeeRole || "موظف",
          avatar: name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase(),
          date: today, check_in: time, status, work_location: workLocation,
          created_by: user.id,
        });
        if (error) throw error;
      }
      return { name, time };
    },
    onSuccess: ({ name, time }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success(`تم تسجيل حضور ${name} في ${time} (${workLocation === "remote" ? "عن بعد" : "من المكتب"})`);
      setCheckInOpen(false); setSelectedEmployee(""); setEmployeeName(""); setEmployeeRole(""); setWorkLocation("office");
    },
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

      // Alert if overtime
      if (hours > maxHours) {
        toast.warning(`⚠️ ${selectedEmployee} عمل ${hours} ساعة وتجاوز الحد (${maxHours} ساعة)`, { duration: 10000 });
      }

      return { name: selectedEmployee, time, hours };
    },
    onSuccess: ({ name, time, hours }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success(`تم تسجيل انصراف ${name} في ${time} (${hours} ساعة)`);
      setCheckOutOpen(false); setSelectedEmployee("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const leaveMut = useMutation({
    mutationFn: async () => {
      const name = leaveName;
      if (!name) throw new Error("أدخل اسم الموظف");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");
      const { error } = await supabase.from("attendance_records").insert({
        name, role: leaveRole || "موظف",
        avatar: name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase(),
        date: leaveDate, status: "leave", leave_type: leaveType, work_location: null,
        created_by: user.id,
      });
      if (error) throw error;
      return name;
    },
    onSuccess: (name) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success(`تم تسجيل إجازة ${name}`);
      setLeaveOpen(false); setLeaveName(""); setLeaveRole(""); setLeaveType("annual");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout title="تسجيل الحضور والانصراف" subtitle="متابعة حضور وانصراف وإجازات فريق العمل">
      <div className="space-y-6">
        {/* Ramadan toggle */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-heading font-semibold text-sm">وضع رمضان</p>
              <p className="text-xs text-muted-foreground">ساعات العمل: {isRamadan ? "6 ساعات" : "8 ساعات (منهم ساعة بريك)"}</p>
            </div>
            <Button variant={isRamadan ? "default" : "outline"} size="sm" onClick={() => setIsRamadan(!isRamadan)}>
              {isRamadan ? "🌙 رمضان مفعل" : "تفعيل وضع رمضان"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard title="الحاضرون" value={presentCount} icon={UserCheck} subtitle={`من ${records.length}`} />
          <KpiCard title="الغائبون" value={absentCount} icon={UserX} />
          <KpiCard title="في إجازة" value={leaveCount} icon={CalendarOff} />
          <KpiCard title="من المكتب" value={officeCount} icon={Building2} />
          <KpiCard title="عن بعد" value={remoteCount} icon={Home} />
          <KpiCard title="تجاوز الساعات" value={overtimeCount} icon={AlertTriangle} subtitle={overtimeCount > 0 ? "⚠️ تنبيه" : ""} />
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-heading">إجراءات سريعة</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2" onClick={() => setCheckInOpen(true)}><LogIn className="h-4 w-4" /> تسجيل حضور</Button>
              <Button variant="outline" className="gap-2" onClick={() => setCheckOutOpen(true)}><LogOut className="h-4 w-4" /> تسجيل انصراف</Button>
              <Button variant="secondary" className="gap-2" onClick={() => setLeaveOpen(true)}><CalendarOff className="h-4 w-4" /> تسجيل إجازة</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading">سجل الحضور - اليوم</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{today}</Badge>
                <Badge variant="outline" className="text-xs">{maxHours} ساعة عمل</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">الحضور</TableHead>
                  <TableHead className="text-right">الانصراف</TableHead>
                  <TableHead className="text-right">الساعات</TableHead>
                  <TableHead className="text-right">المكان</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>
                ) : records.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">لا توجد سجلات لهذا اليوم</TableCell></TableRow>
                ) : records.map(record => (
                  <TableRow key={record.id} className={record.hours_worked && record.hours_worked > maxHours ? "bg-destructive/5" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 text-primary text-xs">{record.avatar}</AvatarFallback></Avatar>
                        <span className="font-medium text-sm">{record.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{record.role}</TableCell>
                    <TableCell className="text-sm">{record.check_in || "—"}</TableCell>
                    <TableCell className="text-sm">{record.check_out || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {record.hours_worked ? (
                        <span className={record.hours_worked > maxHours ? "text-destructive font-bold" : ""}>
                          {record.hours_worked} ساعة
                          {record.hours_worked > maxHours && " ⚠️"}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {record.status === "leave" ? (
                        <Badge variant="outline" className="text-xs">{leaveTypes.find(l => l.value === record.leave_type)?.label || record.leave_type || "إجازة"}</Badge>
                      ) : getLocationBadge(record.work_location)}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Check-in Dialog */}
      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تسجيل حضور</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {records.length > 0 && (
              <Select value={selectedEmployee} onValueChange={v => { setSelectedEmployee(v); setEmployeeName(""); }}>
                <SelectTrigger><SelectValue placeholder="اختر موظف موجود" /></SelectTrigger>
                <SelectContent>{records.filter(r => !r.check_in && r.status !== "leave").map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <div className="space-y-2"><Label>أو أدخل اسم جديد</Label><Input value={employeeName} onChange={e => { setEmployeeName(e.target.value); setSelectedEmployee(""); }} placeholder="اسم الموظف" /></div>
            <div className="space-y-2"><Label>الدور الوظيفي</Label><Input value={employeeRole} onChange={e => setEmployeeRole(e.target.value)} placeholder="مثال: L&D Specialist" /></div>
            <div className="space-y-2">
              <Label>مكان العمل</Label>
              <Select value={workLocation} onValueChange={setWorkLocation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">🏢 من المكتب</SelectItem>
                  <SelectItem value="remote">🏠 عن بعد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">الوقت الحالي: <span className="font-medium text-foreground">{now()}</span></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInOpen(false)}>إلغاء</Button>
            <Button onClick={() => checkInMut.mutate()} disabled={checkInMut.isPending} className="gap-2"><LogIn className="h-4 w-4" /> تسجيل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-out Dialog */}
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

      {/* Leave Dialog */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تسجيل إجازة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>اسم الموظف</Label><Input value={leaveName} onChange={e => setLeaveName(e.target.value)} placeholder="اسم الموظف" /></div>
            <div className="space-y-2"><Label>الدور الوظيفي</Label><Input value={leaveRole} onChange={e => setLeaveRole(e.target.value)} placeholder="مثال: L&D Specialist" /></div>
            <div className="space-y-2">
              <Label>نوع الإجازة</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>التاريخ</Label><Input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>إلغاء</Button>
            <Button onClick={() => leaveMut.mutate()} disabled={leaveMut.isPending} className="gap-2"><CalendarOff className="h-4 w-4" /> تسجيل الإجازة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
