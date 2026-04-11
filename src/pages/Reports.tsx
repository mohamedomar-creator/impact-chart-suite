import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { kpiData, recentActivities, trainingPrograms, teamMembers } from "@/data/mockData";

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function generateTrainingSummaryCSV() {
  const header = "Program,Trainer,Audience,Duration,Enrolled,Completed,Completion Rate,Status";
  const rows = trainingPrograms.map(p => `${p.name},${p.trainer},${p.audience},${p.duration},${p.enrolled},${p.completed},${p.completionRate}%,${p.status}`);
  return [header, ...rows].join("\n");
}

function generateTeamProductivityCSV() {
  const header = "Name,Role,Sessions Delivered,Hours Logged,Productivity,Tasks Completed";
  const rows = teamMembers.map(m => `${m.name},${m.role},${m.sessionsDelivered},${m.hoursLogged},${m.productivity}%,${m.tasksCompleted}`);
  return [header, ...rows].join("\n");
}

function generateActivityLogCSV() {
  const header = "Activity,Type,Team Member,Date,Duration (h),Status";
  const rows = recentActivities.map(a => `${a.title},${a.type},${a.user},${a.date},${a.duration},${a.status}`);
  return [header, ...rows].join("\n");
}

function generateKPISummary() {
  return `Talent Management KPI Summary\n${"=".repeat(40)}\nTotal Training Hours: ${kpiData.totalTrainingHours}\nSessions Delivered: ${kpiData.sessionsDelivered}\nEmployees Trained: ${kpiData.employeesTrained}\nProductivity Score: ${kpiData.productivityScore}%\nCompletion Rate: ${kpiData.learningCompletionRate}%\nImpact Score: ${kpiData.trainingImpactScore}%\n`;
}

const reportTypes = [
  {
    title: "Training Summary Report", description: "Overview of all training programs, completion rates, and impact scores",
    icon: FileText, format: "CSV",
    action: () => { downloadFile("training_summary.csv", generateTrainingSummaryCSV(), "text/csv"); toast.success("تم تحميل تقرير التدريب"); }
  },
  {
    title: "Team Productivity Report", description: "Individual and team performance metrics with trend analysis",
    icon: FileSpreadsheet, format: "CSV",
    action: () => { downloadFile("team_productivity.csv", generateTeamProductivityCSV(), "text/csv"); toast.success("تم تحميل تقرير الإنتاجية"); }
  },
  {
    title: "KPI Summary Report", description: "Key performance indicators overview with current scores",
    icon: FileText, format: "TXT",
    action: () => { downloadFile("kpi_summary.txt", generateKPISummary(), "text/plain"); toast.success("تم تحميل تقرير المؤشرات"); }
  },
  {
    title: "Monthly Activity Log", description: "Detailed log of all activities, hours, and deliverables",
    icon: FileSpreadsheet, format: "CSV",
    action: () => { downloadFile("activity_log.csv", generateActivityLogCSV(), "text/csv"); toast.success("تم تحميل سجل الأنشطة"); }
  },
  {
    title: "Training Impact Assessment", description: "ROI analysis of training programs with pre/post comparisons",
    icon: FileText, format: "CSV",
    action: () => { downloadFile("training_impact.csv", generateTrainingSummaryCSV(), "text/csv"); toast.success("تم تحميل تقرير التأثير"); }
  },
];

const Reports = () => {
  return (
    <DashboardLayout title="Reports" subtitle="Export and download reports">
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
