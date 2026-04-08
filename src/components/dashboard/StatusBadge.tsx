import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  active: "bg-info/10 text-info border-info/20",
  "in-progress": "bg-warning/10 text-warning border-warning/20",
  planned: "bg-muted text-muted-foreground border-border",
  draft: "bg-muted text-muted-foreground border-border",
  "on-track": "bg-success/10 text-success border-success/20",
  "at-risk": "bg-warning/10 text-warning border-warning/20",
  delayed: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize text-xs font-medium", statusStyles[status] || "")}>
      {status.replace("-", " ")}
    </Badge>
  );
}
