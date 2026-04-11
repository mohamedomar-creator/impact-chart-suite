import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { recentActivities as initialActivities } from "@/data/mockData";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const activityTypes = ["Training Session", "Content Development", "LMS Management", "Coaching", "Meeting", "Reporting"];

const Activities = () => {
  const [activities, setActivities] = useState([...initialActivities]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "Training Session", user: "", duration: "", date: new Date().toISOString().split("T")[0] });

  const filtered = activities.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleAdd = () => {
    if (!form.title || !form.user || !form.duration) { toast.error("يرجى ملء جميع الحقول"); return; }
    const newActivity = {
      id: Date.now(),
      title: form.title,
      type: form.type,
      user: form.user,
      duration: parseFloat(form.duration),
      date: form.date,
      status: "in-progress",
    };
    setActivities(prev => [newActivity, ...prev]);
    toast.success(`تم إضافة النشاط: ${form.title}`);
    setForm({ title: "", type: "Training Session", user: "", duration: "", date: new Date().toISOString().split("T")[0] });
    setDialogOpen(false);
  };

  return (
    <DashboardLayout title="Activity Tracking" subtitle="Log and monitor daily activities">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-3 flex-1">
            <Input placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {activityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تسجيل نشاط جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>عنوان النشاط</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثال: جلسة تدريب القيادة" />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{activityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>اسم الموظف</Label>
              <Input value={form.user} onChange={e => setForm(f => ({ ...f, user: e.target.value }))} placeholder="مثال: Sarah Ahmed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المدة (ساعات)</Label>
                <Input type="number" min="0.5" step="0.5" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleAdd} className="gap-2"><Plus className="h-4 w-4" /> إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Activities;
