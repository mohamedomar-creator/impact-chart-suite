import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { monthlyPlan as initialPlan, teamMembers } from "@/data/mockData";
import { Plus, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Planning = () => {
  const [plans, setPlans] = useState([...initialPlan]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ program: "", planned: "", trainer: "" });

  const handleAdd = () => {
    if (!form.program || !form.planned || !form.trainer) { toast.error("يرجى ملء جميع الحقول"); return; }
    setPlans(prev => [...prev, { id: Date.now(), program: form.program, planned: form.planned, status: "planned", trainer: form.trainer }]);
    toast.success(`تم إضافة الخطة: ${form.program}`);
    setForm({ program: "", planned: "", trainer: "" });
    setDialogOpen(false);
  };

  return (
    <DashboardLayout title="Monthly Planning" subtitle="Track planned vs delivered programs">
      <div className="space-y-6">
        <div className="flex justify-between">
          <div />
          <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Add Plan</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">Program</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Trainer</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Planned</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{p.program}</td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell">{p.trainer}</td>
                    <td className="p-4 text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{p.planned}</td>
                    <td className="p-4"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة خطة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>اسم البرنامج</Label>
              <Input value={form.program} onChange={e => setForm(f => ({ ...f, program: e.target.value }))} placeholder="مثال: برنامج القيادة" />
            </div>
            <div className="space-y-2">
              <Label>المدرب</Label>
              <Select value={form.trainer} onValueChange={v => setForm(f => ({ ...f, trainer: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المدرب" /></SelectTrigger>
                <SelectContent>{teamMembers.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الموعد المخطط</Label>
              <Input value={form.planned} onChange={e => setForm(f => ({ ...f, planned: e.target.value }))} placeholder="مثال: Apr 2026" />
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

export default Planning;
