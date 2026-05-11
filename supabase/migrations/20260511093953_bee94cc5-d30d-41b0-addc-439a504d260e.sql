-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  assignee_id UUID,
  created_by UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View tasks (own, assigned, subordinates, admin)"
ON public.tasks FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR assignee_id = auth.uid()
  OR public.can_view_user(auth.uid(), assignee_id)
  OR public.can_view_user(auth.uid(), created_by)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Insert tasks for self/subordinates/admin"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    assignee_id IS NULL
    OR assignee_id = auth.uid()
    OR public.can_view_user(auth.uid(), assignee_id)
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Update tasks (creator/assignee/admin)"
ON public.tasks FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR assignee_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Delete tasks (creator/admin)"
ON public.tasks FOR DELETE TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- Task comments
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View comments on visible tasks"
ON public.task_comments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_comments.task_id
    AND (
      t.created_by = auth.uid()
      OR t.assignee_id = auth.uid()
      OR public.can_view_user(auth.uid(), t.assignee_id)
      OR public.can_view_user(auth.uid(), t.created_by)
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "Insert own comments on visible tasks"
ON public.task_comments FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_comments.task_id
    AND (
      t.created_by = auth.uid()
      OR t.assignee_id = auth.uid()
      OR public.can_view_user(auth.uid(), t.assignee_id)
      OR public.can_view_user(auth.uid(), t.created_by)
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "Delete own comments"
ON public.task_comments FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);