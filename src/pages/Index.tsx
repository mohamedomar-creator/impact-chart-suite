import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kpiData, monthlyTrend, activityCategories, recentActivities } from "@/data/mockData";
import { Activity, Users, Target, Clock, TrendingUp, CalendarCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from "recharts";

const Index = () => {
  return (
    <DashboardLayout title="لوحة التحكم" subtitle="نظرة عامة على إدارة المواهب">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard title="إجمالي الأنشطة" value={kpiData.totalActivities} icon={Activity} trend={{ value: 18, label: "vs الربع الماضي" }} />
          <KpiCard title="أنشطة مخططة" value={kpiData.activitiesPlanned} icon={CalendarCheck} trend={{ value: 12, label: "vs الشهر الماضي" }} variant="primary" />
          <KpiCard title="أنشطة مفاجئة" value={kpiData.activitiesUnplanned} icon={TrendingUp} trend={{ value: -5, label: "vs الشهر الماضي" }} />
          <KpiCard title="الإنتاجية" value={`${kpiData.productivityScore}%`} icon={Target} trend={{ value: 5, label: "vs الشهر الماضي" }} variant="accent" />
          <KpiCard title="نسبة الحضور" value={`${kpiData.attendanceRate}%`} icon={Users} trend={{ value: 3, label: "vs الشهر الماضي" }} />
          <KpiCard title="متوسط الساعات" value={`${kpiData.avgDailyHours}`} icon={Clock} trend={{ value: 2, label: "vs الشهر الماضي" }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-heading">اتجاه الأنشطة والساعات</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="gradActivities" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(200, 60%, 30%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(200, 60%, 30%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 88%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="activities" stroke="hsl(200, 60%, 30%)" fill="url(#gradActivities)" strokeWidth={2} name="الأنشطة" />
                  <Area type="monotone" dataKey="hours" stroke="hsl(38, 92%, 50%)" fill="url(#gradHours)" strokeWidth={2} name="الساعات" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">توزيع الأنشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={activityCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {activityCategories.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {activityCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-medium">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">آخر الأنشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-right py-3 font-medium">النشاط</th>
                    <th className="text-right py-3 font-medium hidden md:table-cell">النوع</th>
                    <th className="text-right py-3 font-medium hidden sm:table-cell">الموظف</th>
                    <th className="text-right py-3 font-medium">المدة</th>
                    <th className="text-right py-3 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium">{a.title}</td>
                      <td className="py-3 hidden md:table-cell text-muted-foreground">{a.type}</td>
                      <td className="py-3 hidden sm:table-cell text-muted-foreground">{a.user}</td>
                      <td className="py-3">{a.duration}h</td>
                      <td className="py-3"><StatusBadge status={a.status} /></td>
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

export default Index;
