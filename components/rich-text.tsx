import { cn } from "@/lib/utils";

/** Renders sanitized rich-text HTML with the Editco prose styles. */
export function RichText({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn("prose-editco text-[15px] text-foreground", className)}
      dangerouslySetInnerHTML={{ __html: html || "<p class='text-muted-foreground'>No content yet.</p>" }}
    />
  );
}
