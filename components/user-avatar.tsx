import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { colorFromString, initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn("h-9 w-9", className)}>
      <AvatarFallback style={{ background: colorFromString(name) }}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
