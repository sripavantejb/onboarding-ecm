"use client";
import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ONBOARDING_STATUSES, ONBOARDING_STATUS_LABELS } from "@/types";

export function EmployeesToolbar({
  departments,
}: {
  departments: { _id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = React.useState(params.get("q") ?? "");

  function update(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v && v !== "all") sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  }

  // Debounced search
  React.useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) update({ q });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or code…" className="pl-9" />
      </div>
      <Select value={params.get("department") ?? "all"} onValueChange={(v) => update({ department: v })}>
        <SelectTrigger className="sm:w-52"><SelectValue placeholder="Department" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All departments</SelectItem>
          {departments.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={params.get("status") ?? "all"} onValueChange={(v) => update({ status: v })}>
        <SelectTrigger className="sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {ONBOARDING_STATUSES.map((s) => <SelectItem key={s} value={s}>{ONBOARDING_STATUS_LABELS[s]}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={params.get("sort") ?? "recent"} onValueChange={(v) => update({ sort: v })}>
        <SelectTrigger className="sm:w-40"><SelectValue placeholder="Sort" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most recent</SelectItem>
          <SelectItem value="name">Name A–Z</SelectItem>
          <SelectItem value="joining">Joining date</SelectItem>
          <SelectItem value="progress">Progress</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
