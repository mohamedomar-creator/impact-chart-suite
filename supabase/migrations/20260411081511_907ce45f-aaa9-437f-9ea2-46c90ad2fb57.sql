
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  job_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'team_member');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Team members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  sessions_delivered INT DEFAULT 0,
  hours_logged NUMERIC DEFAULT 0,
  productivity INT DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read team_members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert team_members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update team_members" ON public.team_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete team_members" ON public.team_members FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activities
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  "user" TEXT NOT NULL,
  duration NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'in-progress',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update activities" ON public.activities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete activities" ON public.activities FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Training programs
CREATE TABLE public.training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trainer TEXT NOT NULL,
  audience TEXT NOT NULL,
  duration TEXT NOT NULL,
  enrolled INT NOT NULL DEFAULT 0,
  completed INT NOT NULL DEFAULT 0,
  completion_rate INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read training_programs" ON public.training_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert training_programs" ON public.training_programs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update training_programs" ON public.training_programs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete training_programs" ON public.training_programs FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_training_programs_updated_at BEFORE UPDATE ON public.training_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Monthly plans
CREATE TABLE public.monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program TEXT NOT NULL,
  planned TEXT NOT NULL,
  trainer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read monthly_plans" ON public.monthly_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert monthly_plans" ON public.monthly_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update monthly_plans" ON public.monthly_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete monthly_plans" ON public.monthly_plans FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_monthly_plans_updated_at BEFORE UPDATE ON public.monthly_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attendance records
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TEXT,
  check_out TEXT,
  hours_worked NUMERIC,
  status TEXT NOT NULL DEFAULT 'absent',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read attendance_records" ON public.attendance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert attendance_records" ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update attendance_records" ON public.attendance_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete attendance_records" ON public.attendance_records FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
