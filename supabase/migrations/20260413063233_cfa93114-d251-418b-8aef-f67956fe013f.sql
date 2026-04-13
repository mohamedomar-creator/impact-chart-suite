
-- Add leave_type and work_location to attendance_records
ALTER TABLE public.attendance_records 
ADD COLUMN IF NOT EXISTS leave_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS work_location text DEFAULT 'office';

-- Create employee_settings table for custom schedules
CREATE TABLE IF NOT EXISTS public.employee_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL UNIQUE,
  daily_hours numeric NOT NULL DEFAULT 8,
  ramadan_hours numeric NOT NULL DEFAULT 6,
  work_type text NOT NULL DEFAULT 'full-time',
  office_days text[] NOT NULL DEFAULT ARRAY['Sunday','Monday','Tuesday','Wednesday'],
  remote_days text[] NOT NULL DEFAULT ARRAY['Saturday','Thursday'],
  is_always_remote boolean NOT NULL DEFAULT false,
  break_hours numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read employee_settings" ON public.employee_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert employee_settings" ON public.employee_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update employee_settings" ON public.employee_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete employee_settings" ON public.employee_settings FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_employee_settings_updated_at BEFORE UPDATE ON public.employee_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
