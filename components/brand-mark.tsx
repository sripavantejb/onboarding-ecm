import { cn } from "@/lib/utils";

/**
 * Editco Media logo lockup — the real EC monogram mark + wordmark.
 * - variant "light" (default): for light surfaces — uses the black-square mark
 *   and dark wordmark text.
 * - variant "dark": for dark surfaces (e.g. the login panel) — uses the white
 *   transparent mark and light wordmark text.
 */
export function BrandMark({
  className,
  showWordmark = true,
  subtitle = "Onboarding",
  size = 30,
  variant = "light",
}: {
  className?: string;
  showWordmark?: boolean;
  subtitle?: string;
  size?: number;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  const markSrc = isDark ? "/brand/mark-white.png" : "/brand/mark-black.png";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={markSrc}
        width={size}
        height={size}
        alt="Editco Media"
        className={cn("shrink-0 select-none", !isDark && "rounded-[8px]")}
        style={{ width: size, height: size }}
        draggable={false}
      />
      {showWordmark && (
        <span
          className={cn(
            "flex items-baseline gap-1.5 text-[15px] font-semibold tracking-tight",
            isDark ? "text-white" : "text-foreground",
          )}
        >
          Editco
          {subtitle && (
            <span className={cn("font-normal", isDark ? "text-white/60" : "text-muted-foreground")}>
              {subtitle}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
