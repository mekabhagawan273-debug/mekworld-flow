import { WriteGate } from "@/components/WriteGate";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/DataTable";
import { Plus, Loader2, Users, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/hr")({
  head: () => ({ meta: [{ title: "HR & Manpower · MekWorld Marines ERP" }] }),
  component: HR,
});

function HR() {
  return (
    <div>
      <PageHeader title="HR & Manpower" subtitle="Employee master, attendance and shifts" />
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="employees"><EmployeesTab /></TabsContent>
        <TabsContent value="attendance"><AttendanceTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function EmployeesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await supabase.from("employees").select("*").order("emp_code")).data ?? [],
  });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("employees").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Employee added"); qc.invalidateQueries({ queryKey: ["employees"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      emp_code: String(fd.get("emp_code")), full_name: String(fd.get("full_name")),
      designation: fd.get("designation") || null, department: fd.get("department") || null,
      date_of_joining: fd.get("date_of_joining") || null,
      phone: fd.get("phone") || null, email: fd.get("email") || null,
      emp_type: String(fd.get("emp_type")),
      salary: Number(fd.get("salary") || 0),
    });
  };

  const active = data.filter((e: any) => e.status === "active").length;
  const contract = data.filter((e: any) => e.emp_type === "contract").length;

  const columns: Column<any>[] = [
    { key: "emp_code", header: "Code", render: (r) => <span className="font-mono text-xs">{r.emp_code}</span> },
    { key: "full_name", header: "Name" },
    { key: "designation", header: "Designation", render: (r) => r.designation ?? "—" },
    { key: "department", header: "Department", render: (r) => r.department ?? "—" },
    { key: "emp_type", header: "Type", render: (r) => <Badge variant="secondary">{r.emp_type}</Badge> },
    { key: "date_of_joining", header: "DOJ", render: (r) => r.date_of_joining ? format(new Date(r.date_of_joining), "dd MMM yy") : "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
    { key: "status", header: "Status", render: (r) => r.status === "active"
        ? <Badge className="bg-success text-white">Active</Badge>
        : <Badge variant="outline">{r.status}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-start gap-3"><Users className="w-5 h-5 text-teal mt-1" /><div><div className="text-xs uppercase text-muted-foreground">Total Employees</div><div className="text-2xl font-bold mt-1">{data.length}</div></div></Card>
        <Card className="p-4 flex items-start gap-3"><UserCheck className="w-5 h-5 text-success mt-1" /><div><div className="text-xs uppercase text-muted-foreground">Active</div><div className="text-2xl font-bold mt-1">{active}</div></div></Card>
        <Card className="p-4 flex items-start gap-3"><UserX className="w-5 h-5 text-info mt-1" /><div><div className="text-xs uppercase text-muted-foreground">Contract Labour</div><div className="text-2xl font-bold mt-1">{contract}</div></div></Card>
      </div>
      <div className="flex justify-end">
        <WriteGate module="hr" note >
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Employee</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>New Employee</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
                <F name="emp_code" label="Employee Code" required />
                <F name="full_name" label="Full Name" required />
                <F name="designation" label="Designation" />
                <div className="space-y-2"><Label>Department</Label>
                  <Select name="department" defaultValue="Processing">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Processing","Quality Control","Cold Storage","Packing","Stores","HR","Admin","Security","Shipping"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Employment Type *</Label>
                  <Select name="emp_type" defaultValue="permanent" required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="daily_wage">Daily Wage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <F name="date_of_joining" label="Date of Joining" type="date" />
                <F name="phone" label="Phone" />
                <F name="email" label="Email" type="email" />
                <F name="salary" label="Monthly Salary (₹)" type="number" step="0.01" />
                <DialogFooter className="col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </WriteGate>
      </div>
      <DataTable data={data} columns={columns} searchKeys={["emp_code", "full_name", "designation", "department"]} loading={isLoading} />
    </div>
  );
}

function AttendanceTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data = [], isLoading } = useQuery({
    queryKey: ["attendance", date],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance")
        .select("*, employees(emp_code, full_name, department)")
        .eq("attendance_date", date)
        .order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    },
  });
  const { data: employees = [] } = useQuery({ queryKey: ["employees_lookup"], queryFn: async () => (await supabase.from("employees").select("id,emp_code,full_name").eq("status", "active")).data ?? [] });

  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("attendance").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Attendance marked"); qc.invalidateQueries({ queryKey: ["attendance"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      employee_id: String(fd.get("employee_id")),
      attendance_date: String(fd.get("attendance_date")),
      status: String(fd.get("status")),
      shift: String(fd.get("shift")),
      hours_worked: Number(fd.get("hours_worked") || 8),
      notes: fd.get("notes") || null,
    });
  };

  const present = data.filter((a: any) => a.status === "present").length;
  const absent = data.filter((a: any) => a.status === "absent").length;
  const leave = data.filter((a: any) => a.status === "leave").length;

  const columns: Column<any>[] = [
    { key: "emp_code", header: "Code", render: (r) => <span className="font-mono text-xs">{r.employees?.emp_code ?? "—"}</span> },
    { key: "employee", header: "Employee", render: (r) => r.employees?.full_name ?? "—" },
    { key: "department", header: "Dept", render: (r) => r.employees?.department ?? "—" },
    { key: "shift", header: "Shift", render: (r) => <Badge variant="secondary">{r.shift}</Badge> },
    { key: "hours_worked", header: "Hours", render: (r) => r.hours_worked },
    { key: "status", header: "Status", render: (r) => {
        const cls = r.status === "present" ? "bg-success text-white"
          : r.status === "leave" ? "bg-info text-white"
          : "bg-destructive text-destructive-foreground";
        return <Badge className={cls}>{r.status}</Badge>;
      } },
  ];

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="p-4"><Label className="text-xs">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
        </Card>
        <Card className="p-4"><div className="text-xs uppercase text-muted-foreground">Present</div><div className="text-2xl font-bold mt-1 text-success">{present}</div></Card>
        <Card className="p-4"><div className="text-xs uppercase text-muted-foreground">Absent</div><div className="text-2xl font-bold mt-1 text-destructive">{absent}</div></Card>
        <Card className="p-4"><div className="text-xs uppercase text-muted-foreground">On Leave</div><div className="text-2xl font-bold mt-1 text-info">{leave}</div></Card>
      </div>
      <div className="flex justify-end">
        <WriteGate module="hr" >
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Mark Attendance</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2"><Label>Employee *</Label>
                  <Select name="employee_id" required>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.emp_code} — {e.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Date *</Label>
                  <Input name="attendance_date" type="date" defaultValue={date} required />
                </div>
                <div className="space-y-2"><Label>Status *</Label>
                  <Select name="status" defaultValue="present" required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="leave">On Leave</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Shift *</Label>
                  <Select name="shift" defaultValue="day" required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Hours Worked</Label>
                  <Input name="hours_worked" type="number" step="0.5" defaultValue={8} />
                </div>
                <DialogFooter className="col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </WriteGate>
      </div>
      <DataTable data={data} columns={columns} searchKeys={[]} loading={isLoading} />
    </div>
  );
}

function F({ name, label, type = "text", required, step }: { name: string; label: string; type?: string; required?: boolean; step?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{required && " *"}</Label>
      <Input id={name} name={name} type={type} step={step} required={required} />
    </div>
  );
}
