import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, Clock, CheckCircle, AlertCircle } from "lucide-react";

const TeamPerformance = () => {
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Calculate workload per team member from activities
  const workloadMap = new Map<string, { totalHours: number; taskCount: number; unplanned: number; planned: number }>();
  activities.forEach(a => {
    const key = a.user;
    const existing = workloadMap.get(key) || { totalHours: 0, taskCount: 0, unplanned: 0, planned: 0 };
    existing.totalHours += Number(a.duration) || 0;
    existing.taskCount += 1;
    if (a.is_planned) existing.planned += 1;
    else existing.unplanned += 1;
    workloadMap.set(key, existing);
  });

  // Merge team members with activity data
  const enriched = teamMembers.map(m => {
    const activityData = workloadMap.get(m.name) || { totalHours: 0, taskCount: 0, unplanned: 0, planned: 0 };
    return { ...m, activityHours: activityData.totalHours, activityTasks: activityData.taskCount, unplanned: activityData.unplanned, planned: activityData.planned };
  });

  const maxHours = Math.max(...enriched.map(m => m.activityHours), 1);
  const maxTasks = Math.max(...enriched.map(m => m.activityTasks), 1);

  // Sort by hours descending for chart
  const chartData = [...enriched]
    .sort((a, b) => b.activityHours - a.activityHours)
    .map(m => ({
      name: m.name.split(" ")[0],
      hours: m.activityHours,
      tasks: m.activityTasks,
      fullName: m.name,
    }));

  // Identify busiest and least busy
  const sorted = [...enriched].sort((a, b) => b.activityHours - a.activityHours);
  const busiest = sorted[0];
  const leastBusy = sorted[sorted.length - 1];

  const getLoadLevel = (hours: number) => {
    const ratio = hours / maxHours;
    if (ratio > 0.75) return { label: "مضغوط", color: "text-red-600", bg: "bg-red-100" };
    if (ratio > 0.4) return { label: "متوسط", color: "text-amber-600", bg: "bg-amber-100" };
    return { label: "متاح", color: "text-green-600", bg: "bg-green-100" };
  };

  return (
    <DashboardLayout title="أداء الفريق وتوزيع الأعمال" subtitle="تحليل عبء العمل لتوزيع المهام بشكل عادل">
      <div className="space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-heading font-bold">{teamMembers.length}</p>
              <p className="text-xs text-muted-foreground">أعضاء الفريق</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-heading font-bold">{enriched.reduce((s, m) => s + m.activityHours, 0).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">إجمالي الساعات</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-sm font-heading font-bold text-red-600">{busiest?.name || "-"}</p>
              <p className="text-xs text-muted-foreground">الأكثر ضغطاً</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-sm font-heading font-bold text-green-600">{leastBusy?.name || "-"}</p>
              <p className="text-xs text-muted-foreground">الأكثر توفراً</p>
            </CardContent>
          </Card>
        </div>

        {/* Hours Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base font-heading">مقارنة ساعات العمل والمهام</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number, name: string) => [value, name === "hours" ? "ساعات" : "مهام"]} />
                <Bar dataKey="hours" name="ساعات" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => {
                    const ratio = entry.hours / maxHours;
                    const color = ratio > 0.75 ? "hsl(0, 72%, 51%)" : ratio > 0.4 ? "hsl(38, 92%, 50%)" : "hsl(142, 71%, 45%)";
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
                <Bar dataKey="tasks" fill="hsl(200, 60%, 30%)" radius={[4, 4, 0, 0]} name="مهام" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Member Cards with workload */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(m => {
            const load = getLoadLevel(m.activityHours);
            const hoursPercent = maxHours > 0 ? (m.activityHours / maxHours) * 100 : 0;
            return (
              <Card key={m.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">{m.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-heading font-semibold">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role}</p>
                      </div>
                    </div>
                    <Badge className={`${load.bg} ${load.color} border-0 text-xs`}>{load.label}</Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">ساعات العمل</span>
                        <span className="font-bold">{m.activityHours.toFixed(1)}h</span>
                      </div>
                      <Progress value={hoursPercent} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-lg font-heading font-bold">{m.activityTasks}</p>
                        <p className="text-[10px] text-muted-foreground">إجمالي المهام</p>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/5">
                        <p className="text-lg font-heading font-bold text-primary">{m.planned}</p>
                        <p className="text-[10px] text-muted-foreground">مخطط</p>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50">
                        <p className="text-lg font-heading font-bold text-amber-600">{m.unplanned}</p>
                        <p className="text-[10px] text-muted-foreground">مفاجئ</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeamPerformance;
