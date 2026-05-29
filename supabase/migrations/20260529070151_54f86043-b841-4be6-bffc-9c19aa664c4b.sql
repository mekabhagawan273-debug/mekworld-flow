
-- ========= ROLES =========
CREATE TYPE public.app_role AS ENUM (
  'super_admin','admin','security_officer','processing_supervisor',
  'store_manager','hr_manager','accounts_officer','gate_guard'
);

-- ========= PROFILES =========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  department TEXT,
  designation TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========= USER ROLES =========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin')
  )
$$;

-- Profile policies
CREATE POLICY "profile_self_read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "profile_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "profile_self_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profile_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Role policies
CREATE POLICY "roles_read_authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1))
  );
  -- First user gets super_admin automatically
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'super_admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========= SHRIMP INTAKE =========
CREATE TABLE public.shrimp_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_number TEXT NOT NULL UNIQUE DEFAULT ('LOT-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6)),
  intake_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_name TEXT NOT NULL,
  vehicle_number TEXT,
  species TEXT NOT NULL CHECK (species IN ('Vannamei','Tiger','Black Tiger')),
  quantity_kg NUMERIC(10,2) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12,2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
  quality_grade TEXT CHECK (quality_grade IN ('A','B','C')),
  moisture_pct NUMERIC(5,2),
  temperature_c NUMERIC(5,2),
  remarks TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shrimp_intake TO authenticated;
GRANT ALL ON public.shrimp_intake TO service_role;
ALTER TABLE public.shrimp_intake ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intake_auth_all" ON public.shrimp_intake FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_intake_updated BEFORE UPDATE ON public.shrimp_intake FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========= PROCESSING BATCHES =========
CREATE TABLE public.processing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL UNIQUE DEFAULT ('BATCH-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6)),
  intake_id UUID REFERENCES public.shrimp_intake(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  processing_type TEXT NOT NULL CHECK (processing_type IN ('Headless','PD','PND','HLSO','Cooked','IQF','Block Frozen')),
  workers_count INT NOT NULL DEFAULT 0,
  machines_used TEXT,
  input_weight_kg NUMERIC(10,2),
  output_weight_kg NUMERIC(10,2),
  wastage_kg NUMERIC(10,2) DEFAULT 0,
  byproduct_kg NUMERIC(10,2) DEFAULT 0,
  byproduct_disposal TEXT,
  yield_pct NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN input_weight_kg > 0 THEN (output_weight_kg / input_weight_kg) * 100 ELSE 0 END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','on_hold')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processing_batches TO authenticated;
GRANT ALL ON public.processing_batches TO service_role;
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "batch_auth_all" ON public.processing_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_batch_updated BEFORE UPDATE ON public.processing_batches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========= QC INSPECTIONS =========
CREATE TABLE public.qc_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.processing_batches(id) ON DELETE CASCADE,
  inspection_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  ph NUMERIC(4,2),
  temperature_c NUMERIC(5,2),
  bacterial_count INT,
  inspector_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','on_hold')),
  remarks TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qc_inspections TO authenticated;
GRANT ALL ON public.qc_inspections TO service_role;
ALTER TABLE public.qc_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qc_auth_all" ON public.qc_inspections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========= COLD STORAGE =========
CREATE TABLE public.cold_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  chamber_no TEXT NOT NULL,
  quantity_kg NUMERIC(10,2) NOT NULL,
  cartons INT DEFAULT 0,
  packing_date DATE,
  best_before DATE,
  temperature_c NUMERIC(5,2),
  temp_min NUMERIC(5,2) DEFAULT -25,
  temp_max NUMERIC(5,2) DEFAULT -18,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cold_storage TO authenticated;
GRANT ALL ON public.cold_storage TO service_role;
ALTER TABLE public.cold_storage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_auth_all" ON public.cold_storage FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_cs_updated BEFORE UPDATE ON public.cold_storage FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========= VISITORS =========
CREATE TABLE public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  id_type TEXT,
  id_number TEXT,
  purpose TEXT,
  host_employee TEXT,
  vehicle_number TEXT,
  check_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitors TO authenticated;
GRANT ALL ON public.visitors TO service_role;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vis_auth_all" ON public.visitors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========= INCIDENTS =========
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  incident_type TEXT NOT NULL CHECK (incident_type IN ('Accident','Near Miss','Security Breach','Fire','Theft','Other')),
  description TEXT NOT NULL,
  persons_involved TEXT,
  action_taken TEXT,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Closed','Under Investigation')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inc_auth_all" ON public.incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_inc_updated BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
