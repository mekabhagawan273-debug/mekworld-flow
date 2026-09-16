# Marine Ops Hub

Build a full-stack ERP web application called MekWorld Marines ERP for a shrimp processing and marine exports company named MEKWORLD MARINES. The application must be production-grade, fully responsive, and have a modern industrial dashboard aesthetic similar to the AquaSecure ERP reference (dark navy sidebar, white content area, colorful stat cards).

🎨 Design & Branding

Company name: MEKWORLD MARINES

Tagline: "Marine Processing & Exports Management System"

Color scheme: Deep navy blue sidebar (#0D1B2A), white main content, teal/cyan accent colors

Logo placeholder with anchor/marine icon in header

Top header bar with: search icon, notification bell with badge count, logout button, and current date display

🔐 Authentication & Roles

Login page with company logo, email + password fields

Role-based access: Super Admin, Admin, Security Officer, Processing Supervisor, Store Manager, HR Manager, Accounts Officer, Gate Guard

Admin panel to create/edit/delete users and assign roles

Each role sees only their permitted modules in the sidebar

JWT-based session with auto-logout on inactivity

📊 Main Dashboard

Banner header card: "MEKWORLD MARINES ERP — Marine Processing & Exports Management System" with company name and today's date (right-aligned)

Two sections: "Today's Activities" and "Month Activities"

Stat cards grid (6 per row on desktop, 2 on mobile) showing counts for: Visitors, RM Inward, RM Outward, GM Inward, GM(NR), GM(R), CM Inward, Shrimp Intake, Production Batches, Shipments, Incidents, Gatepass, Outpass, New Joining

Each card has: colored icon (unique per module), large count number, label below

Quick action buttons: "Add Visitor", "New Batch", "Issue Gatepass"

🦐 Shrimp Processing Module (Core Feature)

Shrimp Intake Register: log each intake with fields — date, supplier name, vehicle number, shrimp species (Vannamei / Tiger / Black Tiger), quantity (kg), price per kg, total cost, quality grade (A/B/C), moisture %, temperature at receipt, remarks. Barcode/lot number auto-generated.

Processing Batch Management: create batches with batch ID, intake lot linked, start time, end time, processing type (Headless, PD, PND, HLSO, Cooked, IQF, Block Frozen), number of workers assigned, machines used

Yield Tracking: input weight, output weight, yield % auto-calculated, wastage logged, by-product tracking (shells, heads — weight and disposal method)

Quality Control Module: QC inspection form per batch — pH, temperature, bacterial count fields, approval/rejection toggle, inspector name, hold/release status

Cold Storage Inventory: track current stock by product type, storage chamber number, temperature log (with min/max alerts), packing date, best before date, quantity in cartons and kg

Packing & Labelling: packing records with net weight, gross weight, carton count, master carton label data (product name, grade, count/size, packing date, lot no.), export destination

Production Reports: daily/weekly/monthly yield reports, species-wise summary, worker productivity report

🚪 Security & Gate Management

Visitor Management: register visitor with photo upload, name, ID type & number, purpose, host employee, check-in/check-out time, vehicle number, visitor badge print

Gatepass Module: inward/outward gate passes for materials, vehicle entry/exit log with driver details

Outpass Module: employee outpass requests, approval workflow, time-out/time-in tracking

Incident Register: log incidents with type (Accident, Near Miss, Security Breach, Fire, Theft), description, persons involved, action taken, status (Open/Closed/Under Investigation)

Security shift log: handover notes, patrol records

📦 Raw Material & Store Management

Raw Material (RM) Inward: supplier, item name, quantity, unit, batch/lot, invoice number, expiry date, received by, storage location

RM Outward: issue slips with item, quantity, issued to department, purpose, authorized by

General Material (GM) Inward/Outward: packing materials, chemicals, consumables

GM Non-Returnable (NR) and Returnable (R) tracking

Canteen Material (CM) Inward tracking for cafeteria supplies

Stock ledger with current stock levels, reorder alerts (highlight items below minimum stock in red)

Supplier master: add/edit suppliers with contact info, material categories, rating

🚢 Shipment & Export Module

Shipment records: shipment ID, buyer name, country, product details, total quantity (kg and cartons), shipping line, vessel name, BL number, container number, port of loading, port of discharge, ETD, ETA, invoice value (USD)

Document checklist per shipment: Health Certificate, Phyto Certificate, BL, Packing List, Invoice, COO — checkbox status for each

Shipment status tracker: Planned → Loading → In Transit → Delivered

Export report: monthly shipment summary by buyer/country/product

👷 HR & Manpower Module

Employee master: employee ID, name, department, designation, date of joining, ID proof, contact, emergency contact, salary details

New Joining register with onboarding checklist

Daily Attendance: mark attendance by department, late arrivals flagged, absentee list

Shift Management: assign employees to shifts (Morning/Evening/Night), shift swap requests

Manpower deployment report per day: department-wise headcount

Contractor/labour management: daily muster roll for contract workers

📋 Reports Module

Security Reports: daily visitor report, incident summary, gatepass report

Manpower Reports: attendance report, overtime report, department headcount

Inhouse Reports: stock summary, material consumption report, cold storage status

Production Reports: batch-wise yield, species-wise summary, QC pass/fail ratio

All reports: date range filter, export to PDF and Excel, print button

⚙️ Admin Panel

User management: create, edit, activate/deactivate users; assign roles

Department master, designation master, material category master, supplier master

Cold storage chamber setup (name, capacity, temperature range)

System settings: company name, logo upload, date format, fiscal year start

Activity/audit log: every user action logged with timestamp, user, module, action description

Notification settings: configure alerts for low stock, QC rejection, incident raised

🔔 Notifications & Alerts

In-app notification bell with unread count badge

Alert types: low stock warning, QC rejection, temperature deviation in cold storage, pending approvals, shipment status change

Notification dropdown panel showing recent alerts with timestamp

🛠️ Tech Stack

Frontend: React + TypeScript + Tailwind CSS

Backend: Supabase (PostgreSQL database, Auth, Storage, Edge Functions)

Charts: Recharts for dashboard analytics

PDF export: react-to-pdf or jsPDF

Excel export: xlsx library

Icons: Lucide React

📱 Additional Requirements

Fully responsive: works on desktop, tablet, and mobile

Sidebar collapses to icon-only on mobile with hamburger menu toggle

All forms have proper validation with error messages

Confirmation dialogs before any delete action

Loading spinners on all async operations

Empty state illustrations when no data exists

Search functionality on all list/table views

Pagination on all data tables (10/25/50 rows per page selector)

Dark mode toggle in header

The app must look professional enough to be used in a real seafood export company in India

Start by building the dashboard, authentication, and shrimp processing module first as these are the core features. Then build out the remaining modules progressively.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mekworld-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0ae0939d-e604-44c4-a05e-470919ba24af).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
