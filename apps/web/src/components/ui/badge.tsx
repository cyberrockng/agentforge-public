import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium",
        tone === "neutral" &&
          "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]",
        tone === "success" &&
          "border-emerald-700/20 bg-emerald-50 text-emerald-800",
        tone === "warning" &&
          "border-amber-700/20 bg-amber-50 text-amber-900",
        className
      )}
      {...props}
    />
  );
}

