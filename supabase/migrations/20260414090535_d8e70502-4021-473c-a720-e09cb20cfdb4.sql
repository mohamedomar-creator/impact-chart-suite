
-- =============================================
-- 1. attendance_records: restrict mutations to owner or admin
-- =============================================
DROP POLICY IF EXISTS "Authenticated can delete attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Authenticated can insert attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Authenticated can update attendance_records" ON public.attendance_records;

CREATE POLICY "Owner or admin can insert attendance" ON public.attendance_records
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can update attendance" ON public.attendance_records
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can delete attendance" ON public.attendance_records
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. employee_settings: admin-only writes, read for all authenticated
-- =============================================
DROP POLICY IF EXISTS "Authenticated can delete employee_settings" ON public.employee_settings;
DROP POLICY IF EXISTS "Authenticated can insert employee_settings" ON public.employee_settings;
DROP POLICY IF EXISTS "Authenticated can update employee_settings" ON public.employee_settings;

CREATE POLICY "Admin can insert employee_settings" ON public.employee_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update employee_settings" ON public.employee_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete employee_settings" ON public.employee_settings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. user_roles: admin-only write policies
-- =============================================
CREATE POLICY "Admin can insert user_roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update user_roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete user_roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. team_members: admin-only writes
-- =============================================
DROP POLICY IF EXISTS "Authenticated can delete team_members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated can insert team_members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated can update team_members" ON public.team_members;

CREATE POLICY "Admin can insert team_members" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update team_members" ON public.team_members
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete team_members" ON public.team_members
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. activities: restrict mutations to owner or admin
-- =============================================
DROP POLICY IF EXISTS "Authenticated can delete activities" ON public.activities;
DROP POLICY IF EXISTS "Authenticated can insert activities" ON public.activities;
DROP POLICY IF EXISTS "Authenticated can update activities" ON public.activities;

CREATE POLICY "Owner or admin can insert activities" ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can update activities" ON public.activities
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can delete activities" ON public.activities
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 6. monthly_plans: restrict mutations to owner or admin
-- =============================================
DROP POLICY IF EXISTS "Authenticated can delete monthly_plans" ON public.monthly_plans;
DROP POLICY IF EXISTS "Authenticated can insert monthly_plans" ON public.monthly_plans;
DROP POLICY IF EXISTS "Authenticated can update monthly_plans" ON public.monthly_plans;

CREATE POLICY "Owner or admin can insert monthly_plans" ON public.monthly_plans
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can update monthly_plans" ON public.monthly_plans
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can delete monthly_plans" ON public.monthly_plans
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 7. activity_types: admin-only writes
-- =============================================
DROP POLICY IF EXISTS "Authenticated can delete activity_types" ON public.activity_types;
DROP POLICY IF EXISTS "Authenticated can insert activity_types" ON public.activity_types;

CREATE POLICY "Admin can insert activity_types" ON public.activity_types
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete activity_types" ON public.activity_types
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 8. training_programs: admin-only (legacy table)
-- =============================================
DROP POLICY IF EXISTS "Authenticated can delete training_programs" ON public.training_programs;
DROP POLICY IF EXISTS "Authenticated can insert training_programs" ON public.training_programs;
DROP POLICY IF EXISTS "Authenticated can update training_programs" ON public.training_programs;

CREATE POLICY "Admin can insert training_programs" ON public.training_programs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update training_programs" ON public.training_programs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete training_programs" ON public.training_programs
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
