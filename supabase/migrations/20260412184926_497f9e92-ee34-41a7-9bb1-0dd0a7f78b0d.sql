
-- Add is_planned column to activities
ALTER TABLE public.activities ADD COLUMN is_planned boolean NOT NULL DEFAULT true;

-- Create custom activity types table
CREATE TABLE public.activity_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read activity_types" ON public.activity_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert activity_types" ON public.activity_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete activity_types" ON public.activity_types FOR DELETE TO authenticated USING (true);

-- Seed default activity types
INSERT INTO public.activity_types (name) VALUES
  ('Training Session'), ('Content Development'), ('LMS Management'), ('Coaching'), ('Meeting'), ('Reporting');
