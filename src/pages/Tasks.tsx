import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Calendar, Pencil, Trash2, MessageSquare, LayoutGrid, List, Search, Send, Flag, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor,
  useSensor, useSensors, useDraggable, useDroppable, closestCorners,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";

type Status = "todo" | "in_progress" | "done";
type Priority = "low" | "medium" | "high" | "urgent";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string | null;
  assignee_id: string | null;
  created_by: string;
  position: number;
  tags: string[] | null;
  created_at: string;
};

type Profile = { user_id: string; display_name: string | null; job_role: string | null };
type Comment = { id: string; task_id: string; user_id: string; content: string; created_at: string };

const STATUSES: { id: Status; label: string; color: string }[] = [
  { id: "todo", label: "للعمل", color: "bg-slate-500" },
  { id: "in_progress", label: "جاري التنفيذ", color: "bg-blue-500" },
  { id: "done", label: "مكتمل", color: "bg-emerald-500" },
];

const PRIORITIES: Record<Priority, { label: string; cls: string }> = {
  low: { label: "منخفض", cls: "bg-slate-100 text-slate-700 border-slate-300" },
  medium: { label: "متوسط", cls: "bg-blue-100 text-blue-700 border-blue-300" },
  high: { label: "عالي", cls: "bg-orange-100 text-orange-700 border-orange-300" },
  urgent: { label: "عاجل", cls: "bg-red-100 text-red-700 border-red-300" },
};

const initials = (name?: string | null) =>
  (name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

const Tasks = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [detail, setDetail] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", status: "todo" as Status, priority: "medium" as Priority,
    due_date: "", assignee_id: "unassigned",
  });
  const [comment, setComment] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("position");
      if (error) throw error;
      return data as Task[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-mini"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id,display_name,job_role");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["task-comments", detail?.id],
    enabled: !!detail,
    queryFn: async () => {
      const { data, error } = await supabase.from("task_comments").select("*")
        .eq("task_id", detail!.id).order("created_at");
      if (error) throw error;
      return data as Comment[];
    },
  });

  const profileMap = useMemo(() => {
    const m = new Map<string, Profile>();
    profiles.forEach(p => m.set(p.user_id, p));
    return m;
  }, [profiles]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterAssignee !== "all") {
        if (filterAssignee === "me" && t.assignee_id !== user?.id) return false;
        if (filterAssignee === "unassigned" && t.assignee_id) return false;
        if (filterAssignee !== "me" && filterAssignee !== "unassigned" && t.assignee_id !== filterAssignee) return false;
      }
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, search, filterAssignee, filterPriority, user]);

  const grouped = useMemo(() => {
    const g: Record<Status, Task[]> = { todo: [], in_progress: [], done: [] };
    filtered.forEach(t => g[t.status]?.push(t));
    return g;
  }, [filtered]);

  const upsert = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!form.title.trim()) throw new Error("العنوان مطلوب");
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        assignee_id: form.assignee_id === "unassigned" ? null : form.assignee_id,
      };
      if (editing) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const maxPos = Math.max(0, ...tasks.filter(t => t.status === form.status).map(t => t.position));
        const { error } = await supabase.from("tasks").insert({
          ...payload, created_by: user.id, position: maxPos + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(editing ? "تم تحديث المهمة" : "تم إنشاء المهمة");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("تم الحذف"); setDetail(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user || !detail || !comment.trim()) return;
      const { error } = await supabase.from("task_comments").insert({
        task_id: detail.id, user_id: user.id, content: comment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["task-comments", detail?.id] }); setComment(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const openAdd = (status: Status = "todo") => {
    setEditing(null);
    setForm({ title: "", description: "", status, priority: "medium", due_date: "", assignee_id: "unassigned" });
    setDialogOpen(true);
  };
  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title, description: t.description || "", status: t.status, priority: t.priority,
      due_date: t.due_date || "", assignee_id: t.assignee_id || "unassigned",
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id);
    const newStatus = String(over.id) as Status;
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus && STATUSES.find(s => s.id === newStatus)) {
      updateStatus.mutate({ id: taskId, status: newStatus });
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DashboardLayout title="إدارة المهام" subtitle="نظّم مهام الفريق بطريقة احترافية">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
          </div>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المكلفين</SelectItem>
              <SelectItem value="me">مهامي</SelectItem>
              <SelectItem value="unassigned">غير معيَّنة</SelectItem>
              {profiles.map(p => (
                <SelectItem key={p.user_id} value={p.user_id}>{p.display_name || "—"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأولويات</SelectItem>
              {Object.entries(PRIORITIES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={view} onValueChange={v => setView(v as any)}>
            <TabsList className="h-9">
              <TabsTrigger value="kanban" className="gap-1"><LayoutGrid className="h-3.5 w-3.5" />Kanban</TabsTrigger>
              <TabsTrigger value="list" className="gap-1"><List className="h-3.5 w-3.5" />List</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => openAdd()} className="gap-2 h-9 ml-auto"><Plus className="h-4 w-4" />مهمة جديدة</Button>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">جاري التحميل...</div>
        ) : view === "kanban" ? (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STATUSES.map(col => (
                <KanbanColumn key={col.id} col={col} tasks={grouped[col.id]} onAdd={() => openAdd(col.id)}
                  onOpen={t => setDetail(t)} profileMap={profileMap} />
              ))}
            </div>
            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} profileMap={profileMap} dragging /> : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground">
                    <th className="text-left p-3 font-medium">المهمة</th>
                    <th className="text-left p-3 font-medium hidden sm:table-cell">المكلف</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">الأولوية</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">الموعد</th>
                    <th className="text-left p-3 font-medium">الحالة</th>
                    <th className="text-left p-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">لا توجد مهام</td></tr>
                  ) : filtered.map(t => {
                    const assignee = t.assignee_id ? profileMap.get(t.assignee_id) : null;
                    return (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => setDetail(t)}>
                        <td className="p-3 font-medium">{t.title}</td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell">{assignee?.display_name || "—"}</td>
                        <td className="p-3 hidden md:table-cell"><Badge variant="outline" className={PRIORITIES[t.priority].cls}>{PRIORITIES[t.priority].label}</Badge></td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{t.due_date ? format(new Date(t.due_date), "MMM d") : "—"}</td>
                        <td className="p-3"><Badge variant="outline">{STATUSES.find(s => s.id === t.status)?.label}</Badge></td>
                        <td className="p-3" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "تعديل المهمة" : "مهمة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>العنوان *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="ماذا يجب إنجازه؟" />
            </div>
            <div className="space-y-1.5"><Label>الوصف</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="تفاصيل إضافية..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>الأولوية</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PRIORITIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>تاريخ الاستحقاق</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5"><Label>المكلف</Label>
                <Select value={form.assignee_id} onValueChange={v => setForm(f => ({ ...f, assignee_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">غير معيَّن</SelectItem>
                    {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.display_name || "—"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>إلغاء</Button>
            <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>{editing ? "حفظ" : "إنشاء"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={v => { if (!v) setDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (() => {
            const assignee = detail.assignee_id ? profileMap.get(detail.assignee_id) : null;
            const creator = profileMap.get(detail.created_by);
            const canEdit = detail.created_by === user?.id || detail.assignee_id === user?.id;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-3">
                    <DialogTitle className="text-lg">{detail.title}</DialogTitle>
                    <div className="flex gap-1">
                      {canEdit && <Button variant="ghost" size="icon" onClick={() => { openEdit(detail); setDetail(null); }}><Pencil className="h-4 w-4" /></Button>}
                      {(detail.created_by === user?.id) && (
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteTask.mutate(detail.id)}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{STATUSES.find(s => s.id === detail.status)?.label}</Badge>
                    <Badge variant="outline" className={PRIORITIES[detail.priority].cls}>
                      <Flag className="h-3 w-3 mr-1" />{PRIORITIES[detail.priority].label}
                    </Badge>
                    {detail.due_date && (
                      <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{format(new Date(detail.due_date), "PPP")}</Badge>
                    )}
                  </div>
                  {detail.description && (
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-3">
                      {detail.description}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">المكلف</p>
                      <div className="flex items-center gap-2">
                        {assignee ? (<><Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{initials(assignee.display_name)}</AvatarFallback></Avatar><span>{assignee.display_name}</span></>)
                          : <span className="text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" />غير معيَّن</span>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">المنشئ</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{initials(creator?.display_name)}</AvatarFallback></Avatar>
                        <span>{creator?.display_name || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="border-t pt-3 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" />التعليقات ({comments.length})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {comments.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">لا توجد تعليقات بعد</p>
                      ) : comments.map(c => {
                        const author = profileMap.get(c.user_id);
                        return (
                          <div key={c.id} className="flex gap-2">
                            <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className="text-[10px]">{initials(author?.display_name)}</AvatarFallback></Avatar>
                            <div className="flex-1 bg-muted/40 rounded-md p-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium">{author?.display_name || "—"}</p>
                                <p className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "PP p")}</p>
                              </div>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="أضف تعليقاً..."
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment.mutate(); } }} />
                      <Button size="icon" onClick={() => addComment.mutate()} disabled={!comment.trim() || addComment.isPending}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

function KanbanColumn({ col, tasks, onAdd, onOpen, profileMap }: {
  col: { id: Status; label: string; color: string };
  tasks: Task[];
  onAdd: () => void;
  onOpen: (t: Task) => void;
  profileMap: Map<string, Profile>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div ref={setNodeRef} className={cn("rounded-lg border bg-muted/20 p-3 min-h-[400px] transition-colors", isOver && "bg-primary/5 border-primary/40")}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", col.color)} />
          <h3 className="text-sm font-semibold">{col.label}</h3>
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">{tasks.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAdd}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="space-y-2">
        {tasks.map(t => (
          <DraggableTask key={t.id} task={t} profileMap={profileMap} onOpen={() => onOpen(t)} />
        ))}
      </div>
    </div>
  );
}

function DraggableTask({ task, profileMap, onOpen }: { task: Task; profileMap: Map<string, Profile>; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={cn(isDragging && "opacity-30")} onClick={onOpen}>
      <TaskCard task={task} profileMap={profileMap} />
    </div>
  );
}

function TaskCard({ task, profileMap, dragging }: { task: Task; profileMap: Map<string, Profile>; dragging?: boolean }) {
  const assignee = task.assignee_id ? profileMap.get(task.assignee_id) : null;
  const overdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date(new Date().toDateString());
  return (
    <Card className={cn("cursor-pointer hover:shadow-md transition-shadow", dragging && "shadow-lg rotate-2")}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0", PRIORITIES[task.priority].cls)}>
            {PRIORITIES[task.priority].label}
          </Badge>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs">
            {task.due_date && (
              <span className={cn("flex items-center gap-1", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                <Calendar className="h-3 w-3" />{format(new Date(task.due_date), "MMM d")}
              </span>
            )}
          </div>
          {assignee ? (
            <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{initials(assignee.display_name)}</AvatarFallback></Avatar>
          ) : <span className="text-[10px] text-muted-foreground">غير معيَّن</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default Tasks;
