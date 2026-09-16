import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { useCanWrite, type WriteModule } from "@/lib/permissions";

/**
 * Renders its children only when the signed-in user's role is allowed to
 * create records in this module. Viewing is never restricted.
 */
export function WriteGate({
  module,
  note = false,
  children,
}: {
  module: WriteModule;
  note?: boolean;
  children: ReactNode;
}) {
  const allowed = useCanWrite(module);
  if (allowed) return <>{children}</>;
  if (!note) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2.5 py-1.5">
      <Eye className="w-3.5 h-3.5" />
      View only for your role
    </span>
  );
}
