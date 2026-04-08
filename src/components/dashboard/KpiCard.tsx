import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "primary" | "accent";
}

export function KpiCard({ title, value, icon: Icon, trend, variant = "default" }: KpiCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      variant === "primary" && "bg-primary text-primary-foreground",
      variant === "accent" && "bg-accent text-accent-foreground",
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className={cn(
              "text-xs font-medium uppercase tracking-wider",
              variant === "default" ? "text-muted-foreground" : "opacity-80"
            )}>{title}</p>
            <p className="text-2xl font-heading font-bold">{value}</p>
          </div>
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center",
            variant === "default" ? "bg-primary/10 text-primary" : "bg-white/20"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3">
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className={cn(
              "text-xs font-medium",
              variant === "default" && (isPositive ? "text-success" : "text-destructive")
            )}>
              {isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className={cn(
              "text-xs",
              variant === "default" ? "text-muted-foreground" : "opacity-70"
            )}>{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
