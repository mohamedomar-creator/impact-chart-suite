import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { monthlyTrend, teamMembers } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

const radarData = teamMembers.map(m => ({
  name: m.name.split(" ")[0],
  hours: Math.round(m.hoursLogged / 10),
  productivity: m.productivity,
  tasks: m.tasksCompleted,
}));

const Analytics = () => {
  return (
    <DashboardLayout title="التحليلات البصرية" subtitle="رسوم بيانية ولوحات تحكم لبيانات الأداء">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base font-heading">الأنشطة والساعات الشهرية</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="activities" fill="hsl(200, 60%, 30%)" radius={[4, 4, 0, 0]} name="الأنشطة" />
                <Bar dataKey="hours" fill="hsl(175, 55%, 45%)" radius={[4, 4, 0, 0]} name="الساعات" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-heading">اتجاه نسبة الحضور</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="attendance" stroke="hsl(175, 55%, 45%)" strokeWidth={3} dot={{ r: 5 }} name="نسبة الحضور %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base font-heading">رادار أداء الفريق</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(200, 20%, 88%)" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                <Radar name="الإنتاجية" dataKey="productivity" stroke="hsl(200, 60%, 30%)" fill="hsl(200, 60%, 30%)" fillOpacity={0.2} />
                <Radar name="المهام" dataKey="tasks" stroke="hsl(175, 55%, 45%)" fill="hsl(175, 55%, 45%)" fillOpacity={0.2} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
