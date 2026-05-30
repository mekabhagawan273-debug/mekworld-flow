
-- Suppliers
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  supplier_type text NOT NULL DEFAULT 'material',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY supp_auth_all ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Materials master (RM/GM/CM/PM)
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'RM',
  uom text NOT NULL DEFAULT 'kg',
  min_stock numeric DEFAULT 0,
  current_stock numeric NOT NULL DEFAULT 0,
  unit_cost numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY mat_auth_all ON public.materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stock movements (inward/outward)
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  quantity numeric NOT NULL,
  reference_no text,
  supplier_id uuid REFERENCES public.suppliers(id),
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY sm_auth_all ON public.stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto update material current_stock
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.material_id IS NOT NULL THEN
    UPDATE public.materials
       SET current_stock = current_stock + CASE WHEN NEW.movement_type = 'in' THEN NEW.quantity ELSE -NEW.quantity END
     WHERE id = NEW.material_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_stock_movement AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- Customers
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text,
  contact_person text,
  email text,
  phone text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cust_auth_all ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Shipments
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_no text NOT NULL DEFAULT ('SHP-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6)),
  customer_id uuid REFERENCES public.customers(id),
  container_no text,
  bl_no text,
  vessel_name text,
  port_of_loading text,
  port_of_discharge text,
  destination_country text,
  ship_date date,
  eta date,
  total_quantity_kg numeric DEFAULT 0,
  total_cartons integer DEFAULT 0,
  invoice_value numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'planned',
  documents_status text DEFAULT 'pending',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY ship_auth_all ON public.shipments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Employees
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  designation text,
  department text,
  date_of_joining date,
  phone text,
  email text,
  emp_type text NOT NULL DEFAULT 'permanent',
  status text NOT NULL DEFAULT 'active',
  salary numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY emp_auth_all ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Attendance
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  shift text DEFAULT 'day',
  hours_worked numeric DEFAULT 8,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, attendance_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY att_auth_all ON public.attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
