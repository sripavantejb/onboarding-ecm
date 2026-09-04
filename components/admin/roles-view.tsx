"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Plus, Pencil, Archive, ArchiveRestore, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { createRole, updateRole, setRoleStatus } from "@/actions/roles";

export interface RoleDTO {
  _id: string;
  title: string;
  description: string;
  status: "active" | "archived";
  departmentId: string;
  departmentName: string;
  employeeCount: number;
}
export interface DeptOption {
  _id: string;
  name: string;
}

export function RolesView({ roles, departments }: { roles: RoleDTO[]; departments: DeptOption[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<RoleDTO | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [archiving, setArchiving] = React.useState<RoleDTO | null>(null);
  const [pending, start] = React.useTransition();

  const active = roles.filter((r) => r.status === "active");
  const grouped = departments
    .map((d) => ({ dept: d, items: active.filter((r) => r.departmentId === d._id) }))
    .filter((g) => g.items.length > 0);

  function toggleArchive(r: RoleDTO) {
    start(async () => {
      const res = await setRoleStatus(r._id, r.status === "active" ? "archived" : "active");
      if (res.ok) { toast.success(res.message); router.refresh(); } else toast.error(res.error);
      setArchiving(null);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Roles belong to departments and drive which onboarding track an employee receives."
        actions={
          <Button variant="brand" onClick={() => setCreating(true)}>
            <Plus /> New role
          </Button>
        }
      />

      {active.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="No roles yet"
          description="Create roles inside your departments."
          action={<Button variant="brand" onClick={() => setCreating(true)}><Plus /> New role</Button>}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ dept, items }) => (
            <div key={dept._id} className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">{dept.name}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((r) => (
                  <Card key={r._id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium leading-tight">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.employeeCount} active employee{r.employeeCount !== 1 && "s"}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem destructive onClick={() => setArchiving(r)}><Archive className="h-4 w-4" /> Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {r.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <RoleDialog
        open={creating || !!editing}
        role={editing}
        departments={departments}
        onOpenChange={(v) => { if (!v) { setCreating(false); setEditing(null); } }}
        onDone={() => router.refresh()}
      />

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(v) => !v && setArchiving(null)}
        title={`Archive ${archiving?.title}?`}
        description="Archived roles are hidden from new employee creation."
        confirmLabel="Archive"
        destructive
        loading={pending}
        onConfirm={() => { if (archiving) toggleArchive(archiving); }}
      />
    </div>
  );
}

function RoleDialog({
  open, role, departments, onOpenChange, onDone,
}: {
  open: boolean;
  role: RoleDTO | null;
  departments: DeptOption[];
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setTitle(role?.title ?? "");
      setDescription(role?.description ?? "");
      setDepartment(role?.departmentId ?? departments[0]?._id ?? "");
    }
  }, [open, role, departments]);

  function submit() {
    start(async () => {
      const res = role
        ? await updateRole(role._id, { title, description, department })
        : await createRole({ title, description, department });
      if (res.ok) { toast.success(res.message); onOpenChange(false); onDone(); } else toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? "Edit role" : "New role"}</DialogTitle>
          <DialogDescription>Roles determine the onboarding track an employee receives.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-title">Title</Label>
            <Input id="role-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sales Executive" />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-desc">Description</Label>
            <Textarea id="role-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role does" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button variant="brand" onClick={submit} disabled={pending || title.trim().length < 2 || !department}>
            {pending ? "Saving…" : role ? "Save changes" : "Create role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
