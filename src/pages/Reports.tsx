import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileSpreadsheet } from "lucide-react";

const reportTypes = [
  { title: "Training Summary Report", description: "Overview of all training programs, completion rates, and impact scores", icon: FileText, format: "PDF" },
  { title: "Team Productivity Report", description: "Individual and team performance metrics with trend analysis", icon: FileSpreadsheet, format: "Excel" },
  { title: "LMS Analytics Report", description: "Course completion, learner progress, and assessment score breakdown", icon: FileText, format: "PDF" },
  { title: "Monthly Activity Log", description: "Detailed log of all activities, hours, and deliverables", icon: FileSpreadsheet, format: "Excel" },
  { title: "Training Impact Assessment", description: "ROI analysis of training programs with pre/post comparisons", icon: FileText, format: "PDF" },
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
              <Button variant="outline" className="gap-2">
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
