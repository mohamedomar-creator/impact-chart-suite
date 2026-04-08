import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { smartInsights } from "@/data/mockData";
import { TrendingUp, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = { trend: TrendingUp, alert: AlertTriangle, recommendation: Lightbulb };
const colorMap = { positive: "border-l-success", negative: "border-l-destructive", neutral: "border-l-warning" };

const Insights = () => {
  return (
    <DashboardLayout title="Smart Insights" subtitle="AI-powered trends and recommendations">
      <div className="space-y-4">
        {smartInsights.map(i => {
          const Icon = iconMap[i.type as keyof typeof iconMap] || Lightbulb;
          return (
            <Card key={i.id} className={cn("border-l-4", colorMap[i.impact as keyof typeof colorMap])}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    i.impact === "positive" ? "bg-success/10 text-success" :
                    i.impact === "negative" ? "bg-destructive/10 text-destructive" :
                    "bg-warning/10 text-warning"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold">{i.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{i.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default Insights;
