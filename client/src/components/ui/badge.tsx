import * as React from "react";
import { cn } from "../../lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
}) {
  const variants = {
    default:
      "bg-bags-primary/15 text-bags-primary border-bags-primary/30",
    success:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning:
      "bg-amber-500/15 text-amber-400 border-amber-500/30",
    danger:
      "bg-red-500/15 text-red-400 border-red-500/30",
    outline:
      "bg-transparent text-bags-muted border-bags-border",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
