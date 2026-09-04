"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Pencil, Archive, ArchiveRestore, MoreHorizontal } from "lucide-react";
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { createDepartment, updateDepartment, setDepartmentStatus } from "@/actions/departments";

export interface DepartmentDTO {
  _id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  roleCount: number;
  employeeCount: number;
}

export function DepartmentsView({ departments }: { departments: DepartmentDTO[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<DepartmentDTO | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [archiving, setArchiving] = React.useState<DepartmentDTO | null>(null);
  const [pending, start] = React.useTransition();

  const active = departments.filter((d) => d.status === "active");
  const archived = departments.filter((d) => d.status === "archived");

  function toggleArchive(d: DepartmentDTO) {
    start(async () => {
      const res = await setDepartmentStatus(d._id, d.status === "active" ? "archived" : "active");
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.error);
      setArchiving(null);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Organize your teams. Roles and onboarding templates hang off departments."
        actions={
          <Button variant="brand" onClick={() => setCreating(true)}>
            <Plus /> New department
          </Button>
        }
      />

      {active.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments yet"
          description="Create your first department to start defining roles and onboarding."
          action={<Button variant="brand" onClick={() => setCreating(true)}><Plus /> New department</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((d) => (
            <Card key={d._id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-foreground">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium leading-tight">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.roleCount} role{d.roleCount !== 1 && "s"} · {d.employeeCount} active
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(d)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem destructive onClick={() => setArchiving(d)}><Archive className="h-4 w-4" /> Archive</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {d.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>}
            </Card>
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Archived</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((d) => (
              <Card key={d._id} className="flex items-center justify-between p-4 opacity-70">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <Badge variant="muted" className="mt-1">Archived</Badge>
                </div>
                <Button variant="outline" size="sm" disabled={pending} onClick={() => toggleArchive(d)}>
                  <ArchiveRestore className="h-4 w-4" /> Restore
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <DepartmentDialog
        open={creating || !!editing}
        department={editing}
        onOpenChange={(v) => {
          if (!v) { setCreating(false); setEditing(null); }
        }}
        onDone={() => router.refresh()}
      />

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(v) => !v && setArchiving(null)}
        title={`Archive ${archiving?.name}?`}
        description="Archived departments and their roles are hidden from new employee creation. Existing onboarding is unaffected."
        confirmLabel="Archive"
        destructive
        loading={pending}
        onConfirm={() => { if (archiving) toggleArchive(archiving); }}
      />
    </div>
  );
}

function DepartmentDialog({
  open, department, onOpenChange, onDone,
}: {
  open: boolean;
  department: DepartmentDTO | null;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setName(department?.name ?? "");
      setDescription(department?.description ?? "");
    }
  }, [open, department]);

  function submit() {
    start(async () => {
      const res = department
        ? await updateDepartment(department._id, { name, description })
        : await createDepartment({ name, description });
      if (res.ok) {
        toast.success(res.message);
        onOpenChange(false);
        onDone();
      } else toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{department ? "Edit department" : "New department"}</DialogTitle>
          <DialogDescription>Departments group roles and their onboarding.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dept-name">Name</Label>
            <Input id="dept-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marketing" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-desc">Description</Label>
            <Textarea id="dept-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this team does" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button variant="brand" onClick={submit} disabled={pending || name.trim().length < 2}>
            {pending ? "Saving…" : department ? "Save changes" : "Create department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
