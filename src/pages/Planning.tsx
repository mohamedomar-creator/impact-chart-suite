import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { monthlyPlan } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";

const Planning = () => {
  return (
    <DashboardLayout title="Monthly Planning" subtitle="Track planned vs delivered programs">
      <div className="space-y-6">
        <div className="flex justify-between">
          <div />
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add Plan</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">Program</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Trainer</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Planned</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyPlan.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{p.program}</td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell">{p.trainer}</td>
                    <td className="p-4 text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{p.planned}</td>
                    <td className="p-4"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Planning;
