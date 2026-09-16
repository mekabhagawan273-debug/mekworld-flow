# Restrict data entry to a user's own department

## What happens today

Everyone signed in can view everything (fine) — but the database also lets **any** signed-in user *add* records to **any** module. Changing or deleting existing records is already limited to Super Admin.

So the real gap is: a Security Officer can add HR, Accounts or Pond records, and the "New …" buttons are visible on every screen to every role.

## What will change

Each role can only add/record data in its own modules. Everyone keeps full view access everywhere. Super Admin and Admin keep write access to everything. Editing and deleting existing records stays Super Admin only, as now.

Department map (same one already shown in the Permissions Matrix screen):

- Security Officer: Visitors, Incidents
- Gate Guard: Visitors
- Processing Supervisor: Batches, QC, Floor Balance, Shrimp Intake
- QC Inspector: QC, Cold Storage, Temperature Log
- Store Manager: Shrimp Intake, Store & Materials, Floor Balance, Scan Document
- HR Manager: HR (employees, attendance)
- Accounts Officer: Purchases, Expenses, Receivables, Production Cost, Shipments, Customers
- Pond Supervisor: Ponds and all pond logs
- Maintenance Technician: Plants, machines, breakdowns, plant logs
- Canteen Staff: view only

Two layers, so it holds even if someone bypasses the screen:

1. **Screen level** — the "New …" / save buttons and entry forms are hidden for roles that don't own that module; a short "view only for your role" note appears instead.
2. **Database level** — the add-record rules on each table are tightened to the owning roles, so a blocked write fails server-side too.

## Technical notes

- New security-definer function `public.can_write(_user_id uuid, _module text)` in the public schema, containing the role-to-module map; returns true for `super_admin` and `admin`. Granted to `authenticated` only.
- Replace every `*_ins` policy's `WITH CHECK (auth.uid() IS NOT NULL)` with `public.can_write(auth.uid(), '<module>')` across all business tables (intake, batches, qc, cold storage, temperature, visitors, incidents, materials, stock movements, suppliers, floor balance, ponds + pond logs, plants + plant logs, employees, attendance, shipments, customers, purchases, expenses, receivables, production costs, ice log). `edit_audit_log` insert stays open so logging never breaks.
- Client helper `src/lib/permissions.ts` exporting `useCanWrite(module)` built on `useAuth().roles`, mirroring the same map; used to gate create dialogs/buttons on each route. The existing `permsFor` in the Permissions Matrix page is refactored to read from this shared map so the matrix and reality can't drift.
- Super Admin edit dialog is unchanged.
