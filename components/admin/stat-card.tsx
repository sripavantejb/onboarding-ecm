import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, icon: Icon, href, accent = "default", hint,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  href?: string;
  accent?: "default" | "brand" | "success" | "warning" | "destructive";
  hint?: string;
}) {
  const accentText = {
    default: "text-muted-foreground",
    brand: "text-brand",
    success: "text-success",
    warning: "text-warning-foreground",
    destructive: "text-destructive",
  }[accent];

  const inner = (
    <Card className={cn("p-4 transition-colors", href && "hover:border-brand/40 hover:bg-muted/20")}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <Icon className={cn("h-4 w-4", accentText)} />}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
