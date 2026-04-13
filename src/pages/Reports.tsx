import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

async function fetchTable(table: string) {
  const { data, error } = await supabase.from(table as any).select("*");
  if (error) throw error;
  return data || [];
}

function downloadXLSX(filename: string, sheetName: string, data: any[]) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

async function downloadMultiSheetXLSX(filename: string, sheets: { name: string; table: string }[]) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const data = await fetchTable(s.table);
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, s.name);
  }
  XLSX.writeFile(wb, filename);
}

const reportTypes = [
  {
    title: "تقرير التدريب الشامل", description: "جميع برامج التدريب مع نسب الإكمال والحالة",
    icon: FileSpreadsheet, format: "XLSX",
    action: async () => {
      try {
        const data = await fetchTable("training_programs");
        downloadXLSX("training_programs.xlsx", "Training", data);
        toast.success("تم تحميل تقرير التدريب");
      } catch { toast.error("فشل التحميل"); }
    }
  },
  {
    title: "تقرير الأنشطة", description: "جميع الأنشطة مع التمييز بين المخطط والمفاجئ",
    icon: FileSpreadsheet, format: "XLSX",
    action: async () => {
      try {
        const data = await fetchTable("activities");
        downloadXLSX("activities.xlsx", "Activities", data);
        toast.success("تم تحميل تقرير الأنشطة");
      } catch { toast.error("فشل التحميل"); }
    }
  },
  {
    title: "تقرير الحضور والانصراف", description: "سجل الحضور والانصراف مع الإجازات وساعات العمل",
    icon: FileSpreadsheet, format: "XLSX",
    action: async () => {
      try {
        const data = await fetchTable("attendance_records");
        downloadXLSX("attendance.xlsx", "Attendance", data);
        toast.success("تم تحميل تقرير الحضور");
      } catch { toast.error("فشل التحميل"); }
    }
  },
  {
    title: "تقرير أعضاء الفريق", description: "بيانات الفريق والإنتاجية والمهام المنجزة",
    icon: FileSpreadsheet, format: "XLSX",
    action: async () => {
      try {
        const data = await fetchTable("team_members");
        downloadXLSX("team_members.xlsx", "Team", data);
        toast.success("تم تحميل تقرير الفريق");
      } catch { toast.error("فشل التحميل"); }
    }
  },
  {
    title: "التقرير الشامل (كل البيانات)", description: "ملف Excel يحتوي على جميع البيانات في أوراق منفصلة",
    icon: FileText, format: "XLSX",
    action: async () => {
      try {
        await downloadMultiSheetXLSX("full_report.xlsx", [
          { name: "Training", table: "training_programs" },
          { name: "Activities", table: "activities" },
          { name: "Attendance", table: "attendance_records" },
          { name: "Team", table: "team_members" },
          { name: "Plans", table: "monthly_plans" },
        ]);
        toast.success("تم تحميل التقرير الشامل");
      } catch { toast.error("فشل التحميل"); }
    }
  },
];

const Reports = () => {
  return (
    <DashboardLayout title="التقارير" subtitle="تصدير وتحميل التقارير بصيغة Excel">
      <div className="grid gap-4">
        {reportTypes.map((r, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <r.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                </div>
              </div>
              <Button variant="outline" className="gap-2" onClick={r.action}>
                <Download className="h-4 w-4" /> {r.format}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
