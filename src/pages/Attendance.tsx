import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, LogIn, LogOut, UserCheck, UserX, Timer } from "lucide-react";
import { useState } from "react";
import { attendanceRecords as initialRecords, teamMembers, type AttendanceRecord } from "@/data/mockData";
import { toast } from "sonner";

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
    case "present":
      return <Badge className="bg-success/15 text-success border-success/30">حاضر</Badge>;
    case "late":
      return <Badge className="bg-warning/15 text-warning border-warning/30">متأخر</Badge>;
    case "absent":
      return <Badge className="bg-destructive/15 text-destructive border-destructive/30">غائب</Badge>;
    case "leave":
      return <Badge className="bg-info/15 text-info border-info/30">إجازة</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([...initialRecords]);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const now = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const todayRecords = records.filter((r) => r.date === today);
  const presentCount = todayRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const absentCount = todayRecords.filter((r) => r.status === "absent").length;
  const lateCount = todayRecords.filter((r) => r.status === "late").length;
  const avgHours = todayRecords.filter((r) => r.hoursWorked).reduce((sum, r) => sum + (r.hoursWorked || 0), 0) / (presentCount || 1);

  const handleCheckIn = () => {
    if (!selectedEmployee) { toast.error("اختر موظف أولاً"); return; }
    const member = teamMembers.find(m => m.name === selectedEmployee);
    if (!member) return;

    const existing = records.find(r => r.name === selectedEmployee && r.date === today);
    if (existing?.checkIn) { toast.error("هذا الموظف سجل حضور بالفعل"); setCheckInOpen(false); return; }

    const time = now();
    const isLate = time > "08:15";

    if (existing) {
      setRecords(prev => prev.map(r => r.id === existing.id ? { ...r, checkIn: time, status: isLate ? "late" : "present" } as AttendanceRecord : r));
    } else {
      setRecords(prev => [...prev, { id: Date.now(), name: member.name, role: member.role, avatar: member.avatar, date: today, checkIn: time, checkOut: null, hoursWorked: null, status: isLate ? "late" : "present" }]);
    }
    toast.success(`تم تسجيل حضور ${selectedEmployee} في ${time}`);
    setSelectedEmployee("");
    setCheckInOpen(false);
  };

  const handleCheckOut = () => {
    if (!selectedEmployee) { toast.error("اختر موظف أولاً"); return; }
    const existing = records.find(r => r.name === selectedEmployee && r.date === today);
    if (!existing?.checkIn) { toast.error("هذا الموظف لم يسجل حضور بعد"); setCheckOutOpen(false); return; }
    if (existing.checkOut) { toast.error("هذا الموظف سجل انصراف بالفعل"); setCheckOutOpen(false); return; }

    const time = now();
    const [inH, inM] = existing.checkIn.split(":").map(Number);
    const [outH, outM] = time.split(":").map(Number);
    const hours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 10) / 10;

    setRecords(prev => prev.map(r => r.id === existing.id ? { ...r, checkOut: time, hoursWorked: hours } : r));
    toast.success(`تم تسجيل انصراف ${selectedEmployee} في ${time} (${hours} ساعة)`);
    setSelectedEmployee("");
    setCheckOutOpen(false);
  };

  // Use today's records if available, else show mock data
  const displayRecords = todayRecords.length > 0 ? todayRecords : records;

  return (
    <DashboardLayout title="تسجيل الحضور والانصراف" subtitle="متابعة حضور وانصراف فريق العمل">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="الحاضرون اليوم" value={presentCount} icon={UserCheck} subtitle={`من ${displayRecords.length} موظف`} />
          <KpiCard title="الغائبون" value={absentCount} icon={UserX} subtitle="بدون إجازة" />
          <KpiCard title="المتأخرون" value={lateCount} icon={Clock} subtitle="وصول بعد الموعد" />
          <KpiCard title="متوسط ساعات العمل" value={`${avgHours.toFixed(1)} ساعة`} icon={Timer} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2" onClick={() => setCheckInOpen(true)}>
                <LogIn className="h-4 w-4" /> تسجيل حضور
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setCheckOutOpen(true)}>
                <LogOut className="h-4 w-4" /> تسجيل انصراف
              </Button>
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
                {displayRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{record.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{record.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{record.role}</TableCell>
                    <TableCell className="text-sm">{record.checkIn || "—"}</TableCell>
                    <TableCell className="text-sm">{record.checkOut || "—"}</TableCell>
                    <TableCell className="text-sm">{record.hoursWorked ? `${record.hoursWorked} ساعة` : "—"}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Check-In Dialog */}
      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل حضور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
              <SelectContent>
                {teamMembers.map(m => <SelectItem key={m.id} value={m.name}>{m.name} - {m.role}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">الوقت الحالي: <span className="font-medium text-foreground">{now()}</span></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInOpen(false)}>إلغاء</Button>
            <Button onClick={handleCheckIn} className="gap-2"><LogIn className="h-4 w-4" /> تسجيل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-Out Dialog */}
      <Dialog open={checkOutOpen} onOpenChange={setCheckOutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل انصراف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
              <SelectContent>
                {teamMembers.filter(m => records.some(r => r.name === m.name && r.date === today && r.checkIn && !r.checkOut)).map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">الوقت الحالي: <span className="font-medium text-foreground">{now()}</span></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckOutOpen(false)}>إلغاء</Button>
            <Button onClick={handleCheckOut} className="gap-2"><LogOut className="h-4 w-4" /> تسجيل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
