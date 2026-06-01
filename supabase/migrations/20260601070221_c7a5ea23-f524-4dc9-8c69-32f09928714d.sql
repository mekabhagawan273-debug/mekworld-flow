
-- ============= roles_master =============
CREATE TABLE public.roles_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL UNIQUE,
  role_display_name text NOT NULL,
  is_built_in boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.roles_master TO anon, authenticated;
GRANT ALL ON public.roles_master TO authenticated;
GRANT ALL ON public.roles_master TO service_role;
ALTER TABLE public.roles_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY rm_select ON public.roles_master FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY rm_insert ON public.roles_master FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY rm_update ON public.roles_master FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY rm_delete ON public.roles_master FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin') AND is_built_in = false);

INSERT INTO public.roles_master (role_name, role_display_name, is_built_in, is_active) VALUES
  ('super_admin','Super Admin',true,true),
  ('admin','Admin',true,true),
  ('security_officer','Security Officer',true,true),
  ('processing_supervisor','Processing Supervisor',true,true),
  ('store_manager','Store Manager',true,true),
  ('hr_manager','HR Manager',true,true),
  ('accounts_officer','Accounts Officer',true,true),
  ('gate_guard','Gate Guard',true,true),
  ('qc_inspector','QC Inspector',true,true),
  ('pond_supervisor','Pond Supervisor',true,true),
  ('maintenance_technician','Maintenance Technician',true,true),
  ('canteen_staff','Canteen Staff',true,true)
ON CONFLICT (role_name) DO NOTHING;

-- ============= edit_audit_log =============
CREATE TABLE public.edit_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  edited_by uuid,
  edited_by_name text,
  edited_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.edit_audit_log TO authenticated;
GRANT ALL ON public.edit_audit_log TO service_role;
ALTER TABLE public.edit_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY eal_select ON public.edit_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY eal_insert ON public.edit_audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ============= Tighten write policies on operational tables =============
-- Pattern: drop existing permissive ALL policy, then re-add granular SELECT/INSERT for all authenticated,
--         UPDATE/DELETE only for super_admin.
DO $$
DECLARE
  t text;
  pol record;
  tables text[] := ARRAY[
    'visitors','incidents','shrimp_intake','processing_batches','qc_inspections','cold_storage',
    'shipments','customers','suppliers','materials','stock_movements','employees','attendance',
    'purchases','expenses','receivables','production_costs','floor_balance_entries','floor_balance_snapshots',
    'ponds','pond_feed_log','pond_harvests','pond_mortality','pond_treatments','pond_water_quality',
    'plants','plant_machines','plant_breakdowns','plant_consumption_log','plant_production_log',
    'temperature_readings','temperature_thresholds','ice_log','scanned_documents'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- drop any pre-existing policies on the table
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', t||'_sel', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)', t||'_ins', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),''super_admin'')) WITH CHECK (public.has_role(auth.uid(),''super_admin''))', t||'_upd', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(),''super_admin''))', t||'_del', t);
  END LOOP;
END $$;
