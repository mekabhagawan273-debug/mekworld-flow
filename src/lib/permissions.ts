import { useAuth, type AppRole } from "@/hooks/use-auth";

/** Modules that can be written to, mirrored in the database function public.can_write(). */
export type WriteModule =
  | "intake" | "batches" | "qc" | "cold_storage" | "temperature"
  | "visitors" | "incidents" | "store" | "floor_balance" | "scan"
  | "ponds" | "plants" | "hr" | "accounts" | "shipments" | "admin";

/** Role -> modules the role may create/record data in. Admins are handled separately. */
export const ROLE_WRITE_MAP: Record<string, WriteModule[]> = {
  security_officer: ["visitors", "incidents"],
  gate_guard: ["visitors"],
  processing_supervisor: ["batches", "qc", "floor_balance", "intake"],
  qc_inspector: ["qc", "cold_storage", "temperature"],
  store_manager: ["intake", "store", "floor_balance", "scan"],
  hr_manager: ["hr"],
  accounts_officer: ["accounts", "shipments"],
  pond_supervisor: ["ponds"],
  maintenance_technician: ["plants"],
  canteen_staff: [],
};

export function canWriteWithRoles(roles: readonly string[], module: WriteModule): boolean {
  if (roles.includes("super_admin")) return true;
  if (roles.includes("admin")) return module !== "admin";
  return roles.some((r) => (ROLE_WRITE_MAP[r] ?? []).includes(module));
}

export function useCanWrite(module: WriteModule): boolean {
  const { roles } = useAuth();
  return canWriteWithRoles(roles as AppRole[], module);
}
