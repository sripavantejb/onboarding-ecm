import { BrandMark } from "@/components/brand-mark";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortalLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/85">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6"><BrandMark /></div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </main>
    </div>
  );
}
