import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarCheck, Clock, UserCheck, CalendarOff, Home, Building2, Download, FileText } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const months = [
  { value: "01", label: "يناير" }, { value: "02", label: "فبراير" }, { value: "03", label: "مارس" },
  { value: "04", label: "أبريل" }, { value: "05", label: "مايو" }, { value: "06", label: "يونيو" },
  { value: "07", label: "يوليو" }, { value: "08", label: "أغسطس" }, { value: "09", label: "سبتمبر" },
  { value: "10", label: "أكتوبر" }, { value: "11", label: "نوفمبر" }, { value: "12", label: "ديسمبر" },
];

const currentYear = new Date().getFullYear();
const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

function getWorkingDaysInMonth(year: number, month: number) {
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 5) count++;
  }
  return count;
}

type EmployeeSummary = {
  name: string;
  avatar: string;
  role: string;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  remoteDays: number;
  officeDays: number;
  totalHours: number;
  expectedHours: number;
  dailyHours: number;
};

export default function MonthlySummary() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const yearNum = parseInt(selectedYear);
  const monthNum = parseInt(selectedMonth);
  const workingDays = getWorkingDaysInMonth(yearNum, monthNum);
  const startDate = `${selectedYear}-${selectedMonth}-01`;
  const endDate = `${selectedYear}-${selectedMonth}-${new Date(yearNum, monthNum, 0).getDate()}`;

  const { data: attendance = [] } = useQuery({
    queryKey: ["monthly-summary-attendance", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance_records").select("*")
        .gte("date", startDate).lte("date", endDate);
      if (error) throw error;
      return data;
    },
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["employee-settings-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employee_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  const employeeMap = new Map<string, EmployeeSummary>();
  attendance.forEach(r => {
    if (!employeeMap.has(r.name)) {
      const empSetting = settings.find(s => s.employee_name === r.name);
      const dailyH = empSetting?.daily_hours ?? 8;
      employeeMap.set(r.name, {
        name: r.name, avatar: r.avatar || r.name.split(" ").map(w => w[0]).join("").substring(0, 2),
        role: r.role, presentDays: 0, leaveDays: 0, absentDays: 0, remoteDays: 0, officeDays: 0,
        totalHours: 0, expectedHours: workingDays * Number(dailyH), dailyHours: Number(dailyH),
      });
    }
    const emp = employeeMap.get(r.name)!;
    if (r.status === "leave") emp.leaveDays++;
    else if (r.status === "absent") emp.absentDays++;
    else {
      emp.presentDays++;
      emp.totalHours += Number(r.hours_worked) || 0;
      if (r.work_location === "remote") emp.remoteDays++;
      else emp.officeDays++;
    }
  });

  const summaries = Array.from(employeeMap.values()).sort((a, b) => b.totalHours - a.totalHours);

  const totalPresent = summaries.reduce((s, e) => s + e.presentDays, 0);
  const totalLeave = summaries.reduce((s, e) => s + e.leaveDays, 0);
  const totalAbsent = summaries.reduce((s, e) => s + e.absentDays, 0);
  const totalHours = summaries.reduce((s, e) => s + e.totalHours, 0);

  const monthLabel = months.find(m => m.value === selectedMonth)?.label || "";

  const exportExcel = () => {
    if (!summaries.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    const rows = summaries.map(e => ({
      "الموظف": e.name, "الدور": e.role, "أيام الحضور": e.presentDays,
      "مكتب": e.officeDays, "ريموت": e.remoteDays, "إجازات": e.leaveDays,
      "غياب": e.absentDays, "الساعات": e.totalHours.toFixed(1),
      "المتوقع": e.expectedHours, "الفرق": (e.totalHours - e.expectedHours).toFixed(1),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Summary");
    XLSX.writeFile(wb, `monthly_summary_${selectedYear}_${selectedMonth}.xlsx`);
    toast.success("تم تحميل ملف Excel");
  };

  const exportPDF = () => {
    if (!summaries.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Monthly Summary - ${monthLabel} ${selectedYear}`, 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Working days: ${workingDays} | Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Employee", "Role", "Present", "Office", "Remote", "Leave", "Absent", "Hours", "Expected", "Diff"]],
      body: summaries.map(e => [
        e.name, e.role, e.presentDays, e.officeDays, e.remoteDays, e.leaveDays,
        e.absentDays, e.totalHours.toFixed(1), e.expectedHours, (e.totalHours - e.expectedHours).toFixed(1),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [26, 82, 118] },
    });

    doc.save(`monthly_summary_${selectedYear}_${selectedMonth}.pdf`);
    toast.success("تم تحميل ملف PDF");
  };

  return (
    <DashboardLayout title="الملخص الشهري" subtitle="ملخص حضور وإجازات وساعات الموظفين">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Badge variant="secondary">{workingDays} يوم عمل في الشهر</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={exportExcel}><Download className="h-4 w-4" /> Excel</Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportPDF}><FileText className="h-4 w-4" /> PDF</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 text-center"><CalendarCheck className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{totalPresent}</p><p className="text-xs text-muted-foreground">أيام حضور</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><CalendarOff className="h-5 w-5 mx-auto text-warning mb-1" /><p className="text-2xl font-bold">{totalLeave}</p><p className="text-xs text-muted-foreground">أيام إجازة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><UserCheck className="h-5 w-5 mx-auto text-destructive mb-1" /><p className="text-2xl font-bold">{totalAbsent}</p><p className="text-xs text-muted-foreground">أيام غياب</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Clock className="h-5 w-5 mx-auto text-accent-foreground mb-1" /><p className="text-2xl font-bold">{totalHours.toFixed(1)}</p><p className="text-xs text-muted-foreground">إجمالي الساعات</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-heading">تفاصيل الموظفين</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-center">أيام الحضور</TableHead>
                  <TableHead className="text-center">مكتب</TableHead>
                  <TableHead className="text-center">ريموت</TableHead>
                  <TableHead className="text-center">إجازات</TableHead>
                  <TableHead className="text-center">غياب</TableHead>
                  <TableHead className="text-center">الساعات</TableHead>
                  <TableHead className="text-center">المتوقع</TableHead>
                  <TableHead className="text-center">الفرق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center p-8 text-muted-foreground">لا توجد بيانات لهذا الشهر</TableCell></TableRow>
                ) : summaries.map(emp => {
                  const diff = emp.totalHours - emp.expectedHours;
                  return (
                    <TableRow key={emp.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 text-primary text-xs">{emp.avatar}</AvatarFallback></Avatar>
                          <span className="font-medium text-sm">{emp.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.role}</TableCell>
                      <TableCell className="text-center">{emp.presentDays}</TableCell>
                      <TableCell className="text-center"><span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{emp.officeDays}</span></TableCell>
                      <TableCell className="text-center"><span className="inline-flex items-center gap-1"><Home className="h-3 w-3" />{emp.remoteDays}</span></TableCell>
                      <TableCell className="text-center">{emp.leaveDays > 0 ? <Badge variant="outline" className="text-warning">{emp.leaveDays}</Badge> : "0"}</TableCell>
                      <TableCell className="text-center">{emp.absentDays > 0 ? <Badge variant="outline" className="text-destructive">{emp.absentDays}</Badge> : "0"}</TableCell>
                      <TableCell className="text-center font-medium">{emp.totalHours.toFixed(1)}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{emp.expectedHours}</TableCell>
                      <TableCell className="text-center">
                        <span className={diff >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                          {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const yearNum = parseInt(selectedYear);
  const monthNum = parseInt(selectedMonth);
  const workingDays = getWorkingDaysInMonth(yearNum, monthNum);
  const startDate = `${selectedYear}-${selectedMonth}-01`;
  const endDate = `${selectedYear}-${selectedMonth}-${new Date(yearNum, monthNum, 0).getDate()}`;

  const { data: attendance = [] } = useQuery({
    queryKey: ["monthly-summary-attendance", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance_records").select("*")
        .gte("date", startDate).lte("date", endDate);
      if (error) throw error;
      return data;
    },
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["employee-settings-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employee_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Build per-employee summary
  const employeeMap = new Map<string, EmployeeSummary>();
  attendance.forEach(r => {
    if (!employeeMap.has(r.name)) {
      const empSetting = settings.find(s => s.employee_name === r.name);
      const dailyH = empSetting?.daily_hours ?? 8;
      employeeMap.set(r.name, {
        name: r.name, avatar: r.avatar || r.name.split(" ").map(w => w[0]).join("").substring(0,2),
        role: r.role, presentDays: 0, leaveDays: 0, absentDays: 0, remoteDays: 0, officeDays: 0,
        totalHours: 0, expectedHours: workingDays * Number(dailyH), dailyHours: Number(dailyH),
      });
    }
    const emp = employeeMap.get(r.name)!;
    if (r.status === "leave") emp.leaveDays++;
    else if (r.status === "absent") emp.absentDays++;
    else {
      emp.presentDays++;
      emp.totalHours += Number(r.hours_worked) || 0;
      if (r.work_location === "remote") emp.remoteDays++;
      else emp.officeDays++;
    }
  });

  const summaries = Array.from(employeeMap.values()).sort((a, b) => b.totalHours - a.totalHours);

  const totalPresent = summaries.reduce((s, e) => s + e.presentDays, 0);
  const totalLeave = summaries.reduce((s, e) => s + e.leaveDays, 0);
  const totalAbsent = summaries.reduce((s, e) => s + e.absentDays, 0);
  const totalHours = summaries.reduce((s, e) => s + e.totalHours, 0);

  return (
    <DashboardLayout title="الملخص الشهري" subtitle="ملخص حضور وإجازات وساعات الموظفين">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{workingDays} يوم عمل في الشهر</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 text-center"><CalendarCheck className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{totalPresent}</p><p className="text-xs text-muted-foreground">أيام حضور</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><CalendarOff className="h-5 w-5 mx-auto text-warning mb-1" /><p className="text-2xl font-bold">{totalLeave}</p><p className="text-xs text-muted-foreground">أيام إجازة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><UserCheck className="h-5 w-5 mx-auto text-destructive mb-1" /><p className="text-2xl font-bold">{totalAbsent}</p><p className="text-xs text-muted-foreground">أيام غياب</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Clock className="h-5 w-5 mx-auto text-accent-foreground mb-1" /><p className="text-2xl font-bold">{totalHours.toFixed(1)}</p><p className="text-xs text-muted-foreground">إجمالي الساعات</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-heading">تفاصيل الموظفين</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-center">أيام الحضور</TableHead>
                  <TableHead className="text-center">مكتب</TableHead>
                  <TableHead className="text-center">ريموت</TableHead>
                  <TableHead className="text-center">إجازات</TableHead>
                  <TableHead className="text-center">غياب</TableHead>
                  <TableHead className="text-center">الساعات</TableHead>
                  <TableHead className="text-center">المتوقع</TableHead>
                  <TableHead className="text-center">الفرق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center p-8 text-muted-foreground">لا توجد بيانات لهذا الشهر</TableCell></TableRow>
                ) : summaries.map(emp => {
                  const diff = emp.totalHours - emp.expectedHours;
                  return (
                    <TableRow key={emp.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 text-primary text-xs">{emp.avatar}</AvatarFallback></Avatar>
                          <span className="font-medium text-sm">{emp.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.role}</TableCell>
                      <TableCell className="text-center">{emp.presentDays}</TableCell>
                      <TableCell className="text-center"><span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{emp.officeDays}</span></TableCell>
                      <TableCell className="text-center"><span className="inline-flex items-center gap-1"><Home className="h-3 w-3" />{emp.remoteDays}</span></TableCell>
                      <TableCell className="text-center">{emp.leaveDays > 0 ? <Badge variant="outline" className="text-warning">{emp.leaveDays}</Badge> : "0"}</TableCell>
                      <TableCell className="text-center">{emp.absentDays > 0 ? <Badge variant="outline" className="text-destructive">{emp.absentDays}</Badge> : "0"}</TableCell>
                      <TableCell className="text-center font-medium">{emp.totalHours.toFixed(1)}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{emp.expectedHours}</TableCell>
                      <TableCell className="text-center">
                        <span className={diff >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                          {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
