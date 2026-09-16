CREATE OR REPLACE FUNCTION public.can_write(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        ur.role IN ('super_admin','admin')
        OR (ur.role = 'security_officer'       AND _module IN ('visitors','incidents'))
        OR (ur.role = 'gate_guard'             AND _module IN ('visitors'))
        OR (ur.role = 'processing_supervisor'  AND _module IN ('batches','qc','floor_balance','intake'))
        OR (ur.role = 'qc_inspector'           AND _module IN ('qc','cold_storage','temperature'))
        OR (ur.role = 'store_manager'          AND _module IN ('intake','store','floor_balance','scan'))
        OR (ur.role = 'hr_manager'             AND _module IN ('hr'))
        OR (ur.role = 'accounts_officer'       AND _module IN ('accounts','shipments'))
        OR (ur.role = 'pond_supervisor'        AND _module IN ('ponds'))
        OR (ur.role = 'maintenance_technician' AND _module IN ('plants'))
      )
  )
$$;

REVOKE ALL ON FUNCTION public.can_write(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_write(uuid, text) TO authenticated, service_role;

-- intake
DROP POLICY IF EXISTS shrimp_intake_ins ON public.shrimp_intake;
CREATE POLICY shrimp_intake_ins ON public.shrimp_intake FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'intake'));

-- batches
DROP POLICY IF EXISTS processing_batches_ins ON public.processing_batches;
CREATE POLICY processing_batches_ins ON public.processing_batches FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'batches'));

-- qc
DROP POLICY IF EXISTS qc_inspections_ins ON public.qc_inspections;
CREATE POLICY qc_inspections_ins ON public.qc_inspections FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'qc'));

-- cold storage
DROP POLICY IF EXISTS cold_storage_ins ON public.cold_storage;
CREATE POLICY cold_storage_ins ON public.cold_storage FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'cold_storage'));

-- temperature
DROP POLICY IF EXISTS temperature_readings_ins ON public.temperature_readings;
CREATE POLICY temperature_readings_ins ON public.temperature_readings FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'temperature'));
DROP POLICY IF EXISTS temperature_thresholds_ins ON public.temperature_thresholds;
CREATE POLICY temperature_thresholds_ins ON public.temperature_thresholds FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'temperature'));
DROP POLICY IF EXISTS ice_log_ins ON public.ice_log;
CREATE POLICY ice_log_ins ON public.ice_log FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'temperature'));

-- security
DROP POLICY IF EXISTS visitors_ins ON public.visitors;
CREATE POLICY visitors_ins ON public.visitors FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'visitors'));
DROP POLICY IF EXISTS incidents_ins ON public.incidents;
CREATE POLICY incidents_ins ON public.incidents FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'incidents'));

-- store
DROP POLICY IF EXISTS materials_ins ON public.materials;
CREATE POLICY materials_ins ON public.materials FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'store'));
DROP POLICY IF EXISTS stock_movements_ins ON public.stock_movements;
CREATE POLICY stock_movements_ins ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'store'));
DROP POLICY IF EXISTS suppliers_ins ON public.suppliers;
CREATE POLICY suppliers_ins ON public.suppliers FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'store'));

-- floor balance
DROP POLICY IF EXISTS floor_balance_entries_ins ON public.floor_balance_entries;
CREATE POLICY floor_balance_entries_ins ON public.floor_balance_entries FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'floor_balance'));
DROP POLICY IF EXISTS floor_balance_snapshots_ins ON public.floor_balance_snapshots;
CREATE POLICY floor_balance_snapshots_ins ON public.floor_balance_snapshots FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'floor_balance'));

-- scan
DROP POLICY IF EXISTS scanned_documents_ins ON public.scanned_documents;
CREATE POLICY scanned_documents_ins ON public.scanned_documents FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'scan'));

-- ponds
DROP POLICY IF EXISTS ponds_ins ON public.ponds;
CREATE POLICY ponds_ins ON public.ponds FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'ponds'));
DROP POLICY IF EXISTS pond_feed_log_ins ON public.pond_feed_log;
CREATE POLICY pond_feed_log_ins ON public.pond_feed_log FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'ponds'));
DROP POLICY IF EXISTS pond_harvests_ins ON public.pond_harvests;
CREATE POLICY pond_harvests_ins ON public.pond_harvests FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'ponds'));
DROP POLICY IF EXISTS pond_mortality_ins ON public.pond_mortality;
CREATE POLICY pond_mortality_ins ON public.pond_mortality FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'ponds'));
DROP POLICY IF EXISTS pond_treatments_ins ON public.pond_treatments;
CREATE POLICY pond_treatments_ins ON public.pond_treatments FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'ponds'));
DROP POLICY IF EXISTS pond_water_quality_ins ON public.pond_water_quality;
CREATE POLICY pond_water_quality_ins ON public.pond_water_quality FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'ponds'));

-- plants
DROP POLICY IF EXISTS plants_ins ON public.plants;
CREATE POLICY plants_ins ON public.plants FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'plants'));
DROP POLICY IF EXISTS plant_machines_ins ON public.plant_machines;
CREATE POLICY plant_machines_ins ON public.plant_machines FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'plants'));
DROP POLICY IF EXISTS plant_breakdowns_ins ON public.plant_breakdowns;
CREATE POLICY plant_breakdowns_ins ON public.plant_breakdowns FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'plants'));
DROP POLICY IF EXISTS plant_production_log_ins ON public.plant_production_log;
CREATE POLICY plant_production_log_ins ON public.plant_production_log FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'plants'));
DROP POLICY IF EXISTS plant_consumption_log_ins ON public.plant_consumption_log;
CREATE POLICY plant_consumption_log_ins ON public.plant_consumption_log FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'plants'));

-- hr
DROP POLICY IF EXISTS employees_ins ON public.employees;
CREATE POLICY employees_ins ON public.employees FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'hr'));
DROP POLICY IF EXISTS attendance_ins ON public.attendance;
CREATE POLICY attendance_ins ON public.attendance FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'hr'));

-- accounts
DROP POLICY IF EXISTS purchases_ins ON public.purchases;
CREATE POLICY purchases_ins ON public.purchases FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'accounts'));
DROP POLICY IF EXISTS expenses_ins ON public.expenses;
CREATE POLICY expenses_ins ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'accounts'));
DROP POLICY IF EXISTS receivables_ins ON public.receivables;
CREATE POLICY receivables_ins ON public.receivables FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'accounts'));
DROP POLICY IF EXISTS production_costs_ins ON public.production_costs;
CREATE POLICY production_costs_ins ON public.production_costs FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'accounts'));

-- shipments & customers
DROP POLICY IF EXISTS shipments_ins ON public.shipments;
CREATE POLICY shipments_ins ON public.shipments FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'shipments'));
DROP POLICY IF EXISTS customers_ins ON public.customers;
CREATE POLICY customers_ins ON public.customers FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'shipments'));