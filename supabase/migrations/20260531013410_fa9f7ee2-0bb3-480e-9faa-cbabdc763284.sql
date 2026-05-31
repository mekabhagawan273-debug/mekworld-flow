
-- ===== PROFILES: add department =====
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;

-- ===== FLOOR BALANCE =====
CREATE TABLE public.floor_balance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('receipt','issue','adjustment')),
  quantity numeric NOT NULL,
  shift text,
  recorded_by uuid,
  recorded_by_name text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.floor_balance_entries TO authenticated;
GRANT ALL ON public.floor_balance_entries TO service_role;
ALTER TABLE public.floor_balance_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY fbe_auth_all ON public.floor_balance_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.floor_balance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift text NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  snapshot_data jsonb NOT NULL,
  supervisor_name text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.floor_balance_snapshots TO authenticated;
GRANT ALL ON public.floor_balance_snapshots TO service_role;
ALTER TABLE public.floor_balance_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY fbs_auth_all ON public.floor_balance_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== SCANNED DOCUMENTS =====
CREATE TABLE public.scanned_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_url text,
  document_type text,
  target_module text,
  extracted_data jsonb,
  saved_record_id uuid,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scanned_documents TO authenticated;
GRANT ALL ON public.scanned_documents TO service_role;
ALTER TABLE public.scanned_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY sd_auth_all ON public.scanned_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('scanned-documents','scanned-documents',false)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY sd_storage_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'scanned-documents');
CREATE POLICY sd_storage_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'scanned-documents');

-- ===== PONDS =====
CREATE TABLE public.ponds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_code text NOT NULL,
  name text NOT NULL,
  size_acres numeric,
  pond_type text NOT NULL DEFAULT 'grow_out',
  status text NOT NULL DEFAULT 'active',
  species text,
  stocking_date date,
  pl_count integer,
  avg_body_weight_g numeric,
  estimated_biomass_kg numeric,
  fcr numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ponds TO authenticated;
GRANT ALL ON public.ponds TO service_role;
ALTER TABLE public.ponds ENABLE ROW LEVEL SECURITY;
CREATE POLICY ponds_auth_all ON public.ponds FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pond_water_quality (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id uuid REFERENCES public.ponds(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  ph numeric, do_mgl numeric, salinity_ppt numeric, temperature_c numeric, ammonia_mgl numeric,
  recorded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pond_water_quality TO authenticated;
GRANT ALL ON public.pond_water_quality TO service_role;
ALTER TABLE public.pond_water_quality ENABLE ROW LEVEL SECURITY;
CREATE POLICY pwq_auth_all ON public.pond_water_quality FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pond_feed_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id uuid REFERENCES public.ponds(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  feed_brand text, feed_type text, quantity_kg numeric,
  recorded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pond_feed_log TO authenticated;
GRANT ALL ON public.pond_feed_log TO service_role;
ALTER TABLE public.pond_feed_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY pfl_auth_all ON public.pond_feed_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pond_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id uuid REFERENCES public.ponds(id) ON DELETE CASCADE,
  treatment_date date NOT NULL DEFAULT CURRENT_DATE,
  product_name text, dosage text, reason text, applied_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pond_treatments TO authenticated;
GRANT ALL ON public.pond_treatments TO service_role;
ALTER TABLE public.pond_treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_auth_all ON public.pond_treatments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pond_harvests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id uuid REFERENCES public.ponds(id) ON DELETE CASCADE,
  harvest_date date NOT NULL DEFAULT CURRENT_DATE,
  total_weight_kg numeric, count_per_kg numeric, destination text, price_per_kg numeric, total_value numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pond_harvests TO authenticated;
GRANT ALL ON public.pond_harvests TO service_role;
ALTER TABLE public.pond_harvests ENABLE ROW LEVEL SECURITY;
CREATE POLICY ph_auth_all ON public.pond_harvests FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pond_mortality (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id uuid REFERENCES public.ponds(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  estimated_count integer, cause text, action_taken text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pond_mortality TO authenticated;
GRANT ALL ON public.pond_mortality TO service_role;
ALTER TABLE public.pond_mortality ENABLE ROW LEVEL SECURITY;
CREATE POLICY pm_auth_all ON public.pond_mortality FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== PLANTS =====
CREATE TABLE public.plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_code text NOT NULL,
  name text NOT NULL,
  plant_type text NOT NULL DEFAULT 'processing',
  capacity numeric,
  capacity_uom text DEFAULT 'tons/day',
  status text NOT NULL DEFAULT 'running',
  supervisor text, total_workers integer DEFAULT 0, location text, commissioned_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plants TO authenticated;
GRANT ALL ON public.plants TO service_role;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY pl_auth_all ON public.plants FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.plant_machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid REFERENCES public.plants(id) ON DELETE CASCADE,
  machine_name text NOT NULL, make_model text, serial_no text,
  last_service_date date, next_service_due date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plant_machines TO authenticated;
GRANT ALL ON public.plant_machines TO service_role;
ALTER TABLE public.plant_machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY plm_auth_all ON public.plant_machines FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.plant_production_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid REFERENCES public.plants(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  planned_kg numeric, actual_kg numeric, recorded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plant_production_log TO authenticated;
GRANT ALL ON public.plant_production_log TO service_role;
ALTER TABLE public.plant_production_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY ppl_auth_all ON public.plant_production_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.plant_breakdowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid REFERENCES public.plants(id) ON DELETE CASCADE,
  machine_name text, start_time timestamptz NOT NULL DEFAULT now(), resolved_time timestamptz,
  issue text, technician text, root_cause text, corrective_action text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plant_breakdowns TO authenticated;
GRANT ALL ON public.plant_breakdowns TO service_role;
ALTER TABLE public.plant_breakdowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY plb_auth_all ON public.plant_breakdowns FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.plant_consumption_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid REFERENCES public.plants(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  energy_kwh numeric, water_kl numeric, recorded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plant_consumption_log TO authenticated;
GRANT ALL ON public.plant_consumption_log TO service_role;
ALTER TABLE public.plant_consumption_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY plc_auth_all ON public.plant_consumption_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== ACCOUNTS =====
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL, invoice_no text, purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  items text, amount numeric NOT NULL DEFAULT 0, gst_pct numeric DEFAULT 0,
  gst_amount numeric DEFAULT 0, total numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  linked_inward_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY pu_auth_all ON public.purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL, description text, amount numeric NOT NULL DEFAULT 0,
  paid_by text, bill_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY ex_auth_all ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.production_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid,
  material_cost numeric DEFAULT 0, labour_cost numeric DEFAULT 0, overhead_cost numeric DEFAULT 0,
  total_cost numeric DEFAULT 0, output_kg numeric DEFAULT 0, cost_per_kg numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_costs TO authenticated;
GRANT ALL ON public.production_costs TO service_role;
ALTER TABLE public.production_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY pc_auth_all ON public.production_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid,
  buyer text NOT NULL, invoice_no text, invoice_value_usd numeric DEFAULT 0,
  amount_received numeric DEFAULT 0, due_date date,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receivables TO authenticated;
GRANT ALL ON public.receivables TO service_role;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
CREATE POLICY rc_auth_all ON public.receivables FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== TEMPERATURE / COLD CHAIN =====
CREATE TABLE public.temperature_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name text NOT NULL UNIQUE,
  min_temp numeric NOT NULL, max_temp numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.temperature_thresholds TO authenticated;
GRANT ALL ON public.temperature_thresholds TO service_role;
ALTER TABLE public.temperature_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY tt_auth_all ON public.temperature_thresholds FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.temperature_thresholds (location_name, min_temp, max_temp) VALUES
('Cold Storage Chamber 1', -25, -18),
('Cold Storage Chamber 2', -25, -18),
('Cold Storage Chamber 3', -25, -18),
('Processing Floor Line 1', 0, 8),
('Processing Floor Line 2', 0, 8),
('Freezer Room', -25, -18),
('Blast Freezer', -40, -30);

CREATE TABLE public.temperature_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name text NOT NULL,
  temperature_c numeric NOT NULL,
  recorded_by text,
  in_range boolean,
  corrective_action text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.temperature_readings TO authenticated;
GRANT ALL ON public.temperature_readings TO service_role;
ALTER TABLE public.temperature_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tr_auth_all ON public.temperature_readings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ice_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  ice_produced_kg numeric DEFAULT 0, ice_consumed_kg numeric DEFAULT 0,
  recorded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ice_log TO authenticated;
GRANT ALL ON public.ice_log TO service_role;
ALTER TABLE public.ice_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY il_auth_all ON public.ice_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
