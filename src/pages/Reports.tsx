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

function generatePDF(title: string, data: any[]) {
  if (!data.length) {
    toast.error("لا توجد بيانات للتصدير");
    return;
  }

  const columns = Object.keys(data[0]);
  const colWidths = columns.map(() => 120);
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const pageWidth = Math.max(tableWidth + 80, 800);
  const rowHeight = 28;
  const headerHeight = 32;
  const pageHeight = 600;
  const marginTop = 80;
  const marginLeft = 40;
  const rowsPerPage = Math.floor((pageHeight - marginTop - 40) / rowHeight);

  const pages: string[] = [];
  const totalPages = Math.ceil(data.length / rowsPerPage);

  for (let page = 0; page < totalPages; page++) {
    const startRow = page * rowsPerPage;
    const endRow = Math.min(startRow + rowsPerPage, data.length);
    const pageData = data.slice(startRow, endRow);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${pageHeight}">`;
    svg += `<style>text { font-family: Arial, sans-serif; font-size: 11px; }</style>`;
    svg += `<rect width="100%" height="100%" fill="white"/>`;
    svg += `<text x="${pageWidth / 2}" y="35" text-anchor="middle" font-size="18" font-weight="bold" fill="#1a5276">${title}</text>`;
    svg += `<text x="${pageWidth / 2}" y="55" text-anchor="middle" font-size="10" fill="#888">صفحة ${page + 1} من ${totalPages} — ${new Date().toLocaleDateString('ar-EG')}</text>`;

    // Header row
    let x = marginLeft;
    columns.forEach((col, i) => {
      svg += `<rect x="${x}" y="${marginTop}" width="${colWidths[i]}" height="${headerHeight}" fill="#1a5276"/>`;
      svg += `<text x="${x + colWidths[i] / 2}" y="${marginTop + 20}" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${escapeXml(col)}</text>`;
      x += colWidths[i];
    });

    // Data rows
    pageData.forEach((row, ri) => {
      const y = marginTop + headerHeight + ri * rowHeight;
      const bgColor = ri % 2 === 0 ? "#f8f9fa" : "#ffffff";
      x = marginLeft;
      columns.forEach((col, ci) => {
        svg += `<rect x="${x}" y="${y}" width="${colWidths[ci]}" height="${rowHeight}" fill="${bgColor}" stroke="#e0e0e0" stroke-width="0.5"/>`;
        const val = row[col] != null ? String(row[col]).substring(0, 18) : "";
        svg += `<text x="${x + colWidths[ci] / 2}" y="${y + 18}" text-anchor="middle" fill="#333" font-size="10">${escapeXml(val)}</text>`;
        x += colWidths[ci];
      });
    });

    svg += `</svg>`;
    pages.push(svg);
  }

  // Create a simple HTML-based PDF download
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>@media print{@page{size:landscape;margin:10mm}body{margin:0}svg{page-break-after:always;display:block;margin:0 auto}svg:last-child{page-break-after:avoid}}</style>
</head><body>${pages.join('')}</body></html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        URL.revokeObjectURL(url);
      }, 500);
    };
  } else {
    // Fallback: download as HTML
    const a = document.createElement('a');
    a.href = url;
    a.download = title + '.html';
    a.click();
    URL.revokeObjectURL(url);
  }
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const reportTypes = [
  {
    title: "تقرير الأنشطة", description: "جميع الأنشطة مع التمييز بين المخطط والمفاجئ",
    icon: FileSpreadsheet, table: "activities", sheetName: "Activities",
  },
  {
    title: "تقرير الحضور والانصراف", description: "سجل الحضور والانصراف مع الإجازات وساعات العمل",
    icon: FileSpreadsheet, table: "attendance_records", sheetName: "Attendance",
  },
  {
    title: "تقرير أعضاء الفريق", description: "بيانات الفريق والإنتاجية والمهام المنجزة",
    icon: FileSpreadsheet, table: "team_members", sheetName: "Team",
  },
  {
    title: "تقرير الخطط الشهرية", description: "الخطط الشهرية وحالة التنفيذ",
    icon: FileSpreadsheet, table: "monthly_plans", sheetName: "Plans",
  },
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
      toast.success(`جاري تجهيز ${title} للطباعة`);
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
        // For PDF full report, combine all data
        const allData: any[] = [];
        for (const t of ["activities", "attendance_records", "team_members", "monthly_plans"]) {
          const data = await fetchTable(t);
          allData.push(...(data as any[]).map((d: any) => ({ ...d, _table: t })));
        }
        generatePDF("التقرير الشامل", allData);
        toast.success("جاري تجهيز التقرير الشامل للطباعة");
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

        {/* Full Report */}
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
