import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, LogIn, LogOut, UserCheck, UserX, Timer } from "lucide-react";
import { useState } from "react";
import { attendanceRecords, type AttendanceRecord } from "@/data/mockData";

const KpiCard = ({ title, value, icon: Icon, subtitle, color }: { title: string; value: string | number; icon: React.ElementType; subtitle?: string; color?: string }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-heading font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color || "bg-primary/10"}`}>
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
  const [records] = useState<AttendanceRecord[]>(attendanceRecords);

  const today = "2026-04-08";
  const todayRecords = records.filter((r) => r.date === today);
  const presentCount = todayRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const absentCount = todayRecords.filter((r) => r.status === "absent").length;
  const lateCount = todayRecords.filter((r) => r.status === "late").length;
  const avgHours = todayRecords.filter((r) => r.hoursWorked).reduce((sum, r) => sum + (r.hoursWorked || 0), 0) / (presentCount || 1);

  return (
    <DashboardLayout title="تسجيل الحضور والانصراف" subtitle="متابعة حضور وانصراف فريق العمل">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="الحاضرون اليوم" value={presentCount} icon={UserCheck} subtitle={`من ${todayRecords.length} موظف`} />
          <KpiCard title="الغائبون" value={absentCount} icon={UserX} subtitle="بدون إجازة" />
          <KpiCard title="المتأخرون" value={lateCount} icon={Clock} subtitle="وصول بعد الموعد" />
          <KpiCard title="متوسط ساعات العمل" value={`${avgHours.toFixed(1)} ساعة`} icon={Timer} />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2">
                <LogIn className="h-4 w-4" />
                تسجيل حضور
              </Button>
              <Button variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                تسجيل انصراف
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
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
                {todayRecords.map((record) => (
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
    </DashboardLayout>
  );
}
