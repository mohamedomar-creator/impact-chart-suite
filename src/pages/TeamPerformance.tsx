import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { teamMembers } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TeamPerformance = () => {
  const chartData = teamMembers.map(m => ({
    name: m.name.split(" ")[0],
    sessions: m.sessionsDelivered,
    hours: m.hoursLogged,
    productivity: m.productivity,
  }));

  return (
    <DashboardLayout title="Team Performance" subtitle="Compare team productivity and contributions">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base font-heading">Productivity Comparison</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="productivity" fill="hsl(200, 60%, 30%)" radius={[4, 4, 0, 0]} name="Productivity %" />
                <Bar dataKey="sessions" fill="hsl(175, 55%, 45%)" radius={[4, 4, 0, 0]} name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teamMembers.map(m => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">{m.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-heading font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-heading font-bold">{m.sessionsDelivered}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-heading font-bold">{m.hoursLogged}</p>
                    <p className="text-xs text-muted-foreground">Hours</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-heading font-bold">{m.productivity}%</p>
                    <p className="text-xs text-muted-foreground">Productivity</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-heading font-bold">{m.tasksCompleted}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
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

export default TeamPerformance;
