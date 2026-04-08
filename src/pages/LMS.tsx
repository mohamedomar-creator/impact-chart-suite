import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { lmsCourses } from "@/data/mockData";

const LMS = () => {
  return (
    <DashboardLayout title="LMS Monitoring" subtitle="Track course completion and learner progress">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Courses</p>
              <p className="text-3xl font-heading font-bold mt-1">{lmsCourses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Enrolled</p>
              <p className="text-3xl font-heading font-bold mt-1">{lmsCourses.reduce((s, c) => s + c.enrolled, 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Score</p>
              <p className="text-3xl font-heading font-bold mt-1">
                {Math.round(lmsCourses.filter(c => c.avgScore > 0).reduce((s, c) => s + c.avgScore, 0) / lmsCourses.filter(c => c.avgScore > 0).length)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-heading">Course Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lmsCourses.map(c => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{c.completed}/{c.enrolled} completed · Avg Score: {c.avgScore || "N/A"}%</p>
                  </div>
                  <div className="w-full sm:w-48">
                    <Progress value={c.enrolled > 0 ? (c.completed / c.enrolled) * 100 : 0} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LMS;
