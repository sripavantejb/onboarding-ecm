import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center"><BrandMark /></div>
        <div className="space-y-1.5">
          <p className="text-5xl font-semibold tracking-tight">404</p>
          <p className="text-sm text-muted-foreground">We couldn&apos;t find the page you were looking for.</p>
        </div>
        <Button asChild variant="outline"><Link href="/dashboard">Back to dashboard</Link></Button>
      </div>
    </div>
  );
}
