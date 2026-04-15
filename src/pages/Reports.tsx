import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

function generatePDF(title: string, data: any[]) {
  if (!data.length) { toast.error("لا توجد بيانات للتصدير"); return; }
  const columns = Object.keys(data[0]);
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 21);

  autoTable(doc, {
    startY: 26,
    head: [columns],
    body: data.map(row => columns.map(col => row[col] != null ? String(row[col]).substring(0, 30) : "")),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [26, 82, 118] },
  });

  doc.save(`${title}.pdf`);
}

const reportTypes = [
  { title: "تقرير الأنشطة", description: "جميع الأنشطة مع التمييز بين المخطط والمفاجئ", icon: FileSpreadsheet, table: "activities", sheetName: "Activities" },
  { title: "تقرير الحضور والانصراف", description: "سجل الحضور والانصراف مع الإجازات وساعات العمل", icon: FileSpreadsheet, table: "attendance_records", sheetName: "Attendance" },
  { title: "تقرير أعضاء الفريق", description: "بيانات الفريق والإنتاجية والمهام المنجزة", icon: FileSpreadsheet, table: "team_members", sheetName: "Team" },
  { title: "تقرير الخطط الشهرية", description: "الخطط الشهرية وحالة التنفيذ", icon: FileSpreadsheet, table: "monthly_plans", sheetName: "Plans" },
];

const Reports = () => {
  const handleExcelDownload = async (table: string, sheetName: string, title: string) => {
    try {
      const data = await fetchTable(table);
      downloadXLSX(`${sheetName.toLowerCase()}.xlsx`, sheetName, data);
      toast.success(`تم تحميل ${title}`);
    } catch { toast.error("فشل التحميل"); }
  };

  const handlePDFDownload = async (table: string, title: string) => {
    try {
      const data = await fetchTable(table);
      generatePDF(title, data);
      toast.success(`تم تحميل ${title}`);
    } catch { toast.error("فشل التحميل"); }
  };

  const handleFullReport = async (format: 'xlsx' | 'pdf') => {
    try {
      if (format === 'xlsx') {
        await downloadMultiSheetXLSX("full_report.xlsx", [
          { name: "Activities", table: "activities" },
          { name: "Attendance", table: "attendance_records" },
          { name: "Team", table: "team_members" },
          { name: "Plans", table: "monthly_plans" },
        ]);
        toast.success("تم تحميل التقرير الشامل");
      } else {
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Full Report", 14, 15);
        let first = true;
        for (const t of reportTypes) {
          const data = await fetchTable(t.table);
          if (!data.length) continue;
          if (!first) doc.addPage();
          first = false;
          const cols = Object.keys(data[0]);
          doc.setFontSize(13);
          doc.text(t.title, 14, first ? 25 : 15);
          autoTable(doc, {
            startY: first ? 30 : 20,
            head: [cols],
            body: data.map(row => cols.map(col => row[col] != null ? String(row[col]).substring(0, 30) : "")),
            styles: { fontSize: 7 },
            headStyles: { fillColor: [26, 82, 118] },
          });
        }
        doc.save("full_report.pdf");
        toast.success("تم تحميل التقرير الشامل");
      }
    } catch { toast.error("فشل التحميل"); }
  };

  return (
    <DashboardLayout title="التقارير" subtitle="تصدير وتحميل التقارير بصيغة Excel و PDF">
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
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => handleExcelDownload(r.table, r.sheetName, r.title)}>
                  <Download className="h-4 w-4" /> Excel
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => handlePDFDownload(r.table, r.title)}>
                  <FileText className="h-4 w-4" /> PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="hover:shadow-md transition-shadow border-primary/20 bg-primary/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">التقرير الشامل (كل البيانات)</h3>
                <p className="text-sm text-muted-foreground">ملف يحتوي على جميع البيانات في أوراق منفصلة</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => handleFullReport('xlsx')}>
                <Download className="h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => handleFullReport('pdf')}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
