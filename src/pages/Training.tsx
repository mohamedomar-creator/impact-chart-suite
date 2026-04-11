import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trainingPrograms as initialPrograms } from "@/data/mockData";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Training = () => {
  const [programs, setPrograms] = useState([...initialPrograms]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", trainer: "", audience: "", duration: "", enrolled: "" });

  const handleAdd = () => {
    if (!form.name || !form.trainer || !form.audience || !form.duration || !form.enrolled) { toast.error("يرجى ملء جميع الحقول"); return; }
    const newProgram = {
      id: Date.now(),
      name: form.name,
      trainer: form.trainer,
      audience: form.audience,
      duration: form.duration,
      enrolled: parseInt(form.enrolled),
      completed: 0,
      status: "planned",
      completionRate: 0,
    };
    setPrograms(prev => [newProgram, ...prev]);
    toast.success(`تم إضافة البرنامج: ${form.name}`);
    setForm({ name: "", trainer: "", audience: "", duration: "", enrolled: "" });
    setDialogOpen(false);
  };

  return (
    <DashboardLayout title="Training Management" subtitle="Track training programs and progress">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div />
          <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> New Program</Button>
        </div>

        <div className="grid gap-4">
          {programs.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-heading font-semibold">{p.name}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Trainer: {p.trainer}</span>
                      <span>Audience: {p.audience}</span>
                      <span>Duration: {p.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 lg:w-80">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{p.completed}/{p.enrolled} completed</span>
                        <span>{p.completionRate}%</span>
                      </div>
                      <Progress value={p.completionRate} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة برنامج تدريبي جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>اسم البرنامج</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: برنامج القيادة" />
            </div>
            <div className="space-y-2">
              <Label>المدرب</Label>
              <Input value={form.trainer} onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))} placeholder="مثال: Sarah Ahmed" />
            </div>
            <div className="space-y-2">
              <Label>الجمهور المستهدف</Label>
              <Input value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} placeholder="مثال: Mid-level Managers" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المدة</Label>
                <Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="مثال: 4 weeks" />
              </div>
              <div className="space-y-2">
                <Label>عدد المسجلين</Label>
                <Input type="number" value={form.enrolled} onChange={e => setForm(f => ({ ...f, enrolled: e.target.value }))} />
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

export default Training;
