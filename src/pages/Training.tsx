import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { trainingPrograms } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Training = () => {
  return (
    <DashboardLayout title="Training Management" subtitle="Track training programs and progress">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div />
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Program</Button>
        </div>

        <div className="grid gap-4">
          {trainingPrograms.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-heading font-semibold">{p.name}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Trainer: {p.trainer}</span>
                      <span>Audience: {p.audience}</span>
                      <span>Duration: {p.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 lg:w-80">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{p.completed}/{p.enrolled} completed</span>
                        <span>{p.completionRate}%</span>
                      </div>
                      <Progress value={p.completionRate} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Training;
