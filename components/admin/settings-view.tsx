"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, KeyRound, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { changeMyPassword, createUser, setUserStatus } from "@/actions/users";
import { USER_ROLES, ROLE_LABELS, type UserRole } from "@/types";

export interface SettingsUserDTO {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "disabled";
}

export function SettingsView({
  me,
  isSuperAdmin,
  users,
  currentUserId,
}: {
  me: { name: string; email: string; role: UserRole };
  isSuperAdmin: boolean;
  users: SettingsUserDTO[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and, if you’re a super admin, your team."
      />
      <AccountCard me={me} />
      {isSuperAdmin && <TeamCard users={users} currentUserId={currentUserId} />}
    </div>
  );
}

function AccountCard({ me }: { me: { name: string; email: string; role: UserRole } }) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, start] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    start(async () => {
      const res = await changeMyPassword({ currentPassword, newPassword });
      if (res.ok) {
        toast.success(res.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirm("");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your account</CardTitle>
        <CardDescription>Your profile details and password.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3">
          <UserAvatar name={me.name} className="h-11 w-11" />
          <div className="min-w-0">
            <p className="font-medium leading-tight">{me.name}</p>
            <p className="truncate text-sm text-muted-foreground">{me.email}</p>
          </div>
          <Badge variant="secondary" className="ml-auto">{ROLE_LABELS[me.role]}</Badge>
        </div>

        <form onSubmit={submit} className="space-y-4 border-t pt-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="h-4 w-4 text-muted-foreground" /> Change password
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="brand"
              disabled={pending || !currentPassword || !newPassword || !confirm}
            >
              {pending ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TeamCard({
  users,
  currentUserId,
}: {
  users: SettingsUserDTO[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [pending, start] = React.useTransition();

  function toggleStatus(u: SettingsUserDTO) {
    start(async () => {
      const res = await setUserStatus(u._id, u.status === "active" ? "disabled" : "active");
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Team members</CardTitle>
          <CardDescription>Admins who can sign in to Editco Onboarding.</CardDescription>
        </div>
        <Button variant="brand" size="sm" onClick={() => setCreating(true)}>
          <Plus /> New user
        </Button>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Invite your first admin to get started."
            action={<Button variant="brand" onClick={() => setCreating(true)}><Plus /> New user</Button>}
          />
        ) : (
          <ul className="divide-y">
            {users.map((u) => {
              const isSelf = u._id === currentUserId;
              return (
                <li key={u._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <UserAvatar name={u.name} />
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">
                      {u.name}
                      {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">{ROLE_LABELS[u.role]}</Badge>
                  <Badge variant={u.status === "active" ? "success" : "muted"}>
                    {u.status === "active" ? "Active" : "Disabled"}
                  </Badge>
                  {!isSelf && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => toggleStatus(u)}
                    >
                      {u.status === "active" ? (
                        <><Ban className="h-4 w-4" /> Disable</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4" /> Enable</>
                      )}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <NewUserDialog
        open={creating}
        onOpenChange={setCreating}
        onDone={() => router.refresh()}
      />
    </Card>
  );
}

function NewUserDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("HR_ADMIN");
  const [password, setPassword] = React.useState("");
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setRole("HR_ADMIN");
      setPassword("");
    }
  }, [open]);

  function submit() {
    start(async () => {
      const res = await createUser({ name, email, role, password });
      if (res.ok) {
        toast.success(res.message);
        onOpenChange(false);
        onDone();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>Create an admin account. They can sign in immediately.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Name</Label>
            <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@editco.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger id="user-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">Temporary password</Label>
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button
            variant="brand"
            onClick={submit}
            disabled={pending || name.trim().length < 2 || !email || password.length < 8}
          >
            {pending ? "Creating…" : "Create user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
