import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recentActivities } from "@/data/mockData";
import { Plus, Filter } from "lucide-react";
import { useState } from "react";

const activityTypes = ["Training Session", "Content Development", "LMS Management", "Coaching", "Meeting", "Reporting"];

const Activities = () => {
  const [search, setSearch] = useState("");

  const filtered = recentActivities.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.user.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Activity Tracking" subtitle="Log and monitor daily activities">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-3 flex-1">
            <Input placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Log Activity
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">Activity</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Team Member</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Duration</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium">{a.title}</td>
                      <td className="p-4 text-muted-foreground">{a.type}</td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{a.user}</td>
                      <td className="p-4 text-muted-foreground">{a.date}</td>
                      <td className="p-4">{a.duration}h</td>
                      <td className="p-4"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Activities;
