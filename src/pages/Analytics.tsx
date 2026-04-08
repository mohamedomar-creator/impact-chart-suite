import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { monthlyTrend, teamMembers } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

const radarData = teamMembers.map(m => ({
  name: m.name.split(" ")[0],
  sessions: m.sessionsDelivered,
  hours: Math.round(m.hoursLogged / 10),
  productivity: m.productivity,
  tasks: m.tasksCompleted,
}));

const Analytics = () => {
  return (
    <DashboardLayout title="Visual Analytics" subtitle="Charts and dashboards for learning data">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base font-heading">Monthly Sessions & Employees</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="hsl(200, 60%, 30%)" radius={[4, 4, 0, 0]} name="Sessions" />
                <Bar dataKey="employees" fill="hsl(175, 55%, 45%)" radius={[4, 4, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-heading">Productivity Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="productivity" stroke="hsl(175, 55%, 45%)" strokeWidth={3} dot={{ r: 5 }} name="Productivity %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base font-heading">Team Performance Radar</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(200, 20%, 88%)" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                <Radar name="Productivity" dataKey="productivity" stroke="hsl(200, 60%, 30%)" fill="hsl(200, 60%, 30%)" fillOpacity={0.2} />
                <Radar name="Sessions" dataKey="sessions" stroke="hsl(175, 55%, 45%)" fill="hsl(175, 55%, 45%)" fillOpacity={0.2} />
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
