"use client";
import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { timeAgo, cn } from "@/lib/utils";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationDTO,
} from "@/actions/notifications";

export function NotificationBell({
  items,
  unread,
}: {
  items: NotificationDTO[];
  unread: number;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              disabled={pending}
              onClick={() => start(async () => {
                await markAllNotificationsRead();
                router.refresh();
              })}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {items.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            items.map((n) => {
              const body = (
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-brand",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    {n.message && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              );
              const onClick = () =>
                start(async () => {
                  if (!n.read) await markNotificationRead(n._id);
                  router.refresh();
                });
              return n.link ? (
                <Link
                  key={n._id}
                  href={n.link}
                  onClick={onClick}
                  className={cn("block px-3 py-2.5 hover:bg-muted/50", !n.read && "bg-brand/[0.03]")}
                >
                  {body}
                </Link>
              ) : (
                <button
                  key={n._id}
                  onClick={onClick}
                  className={cn(
                    "block w-full px-3 py-2.5 text-left hover:bg-muted/50",
                    !n.read && "bg-brand/[0.03]",
                  )}
                >
                  {body}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
