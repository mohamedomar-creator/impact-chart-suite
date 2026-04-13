
-- Add manager_id to profiles for hierarchy
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Recursive function to get all subordinate user_ids for a given manager
CREATE OR REPLACE FUNCTION public.get_subordinates(_manager_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE subordinates AS (
    SELECT user_id FROM public.profiles WHERE manager_id = _manager_id
    UNION ALL
    SELECT p.user_id FROM public.profiles p INNER JOIN subordinates s ON p.manager_id = s.user_id
  )
  SELECT user_id FROM subordinates;
$$;

-- Function to check if current user can view another user's data
CREATE OR REPLACE FUNCTION public.can_view_user(_viewer_id uuid, _target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _viewer_id = _target_id 
    OR _target_id IN (SELECT public.get_subordinates(_viewer_id))
    OR public.has_role(_viewer_id, 'admin')
$$;

-- Update activities RLS: users see own + subordinates' activities
DROP POLICY IF EXISTS "Authenticated can read activities" ON public.activities;
CREATE POLICY "Users can read visible activities" ON public.activities
  FOR SELECT TO authenticated
  USING (
    public.can_view_user(auth.uid(), created_by)
    OR created_by IS NULL
  );

-- Update attendance RLS: users see own + subordinates' attendance  
DROP POLICY IF EXISTS "Authenticated can read attendance_records" ON public.attendance_records;
CREATE POLICY "Users can read visible attendance" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (
    public.can_view_user(auth.uid(), created_by)
    OR created_by IS NULL
  );

-- Update monthly_plans RLS
DROP POLICY IF EXISTS "Authenticated can read monthly_plans" ON public.monthly_plans;
CREATE POLICY "Users can read visible plans" ON public.monthly_plans
  FOR SELECT TO authenticated
  USING (
    public.can_view_user(auth.uid(), created_by)
    OR created_by IS NULL
  );
