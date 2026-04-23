import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  accent = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: number;
  accent?: "primary" | "cyan" | "success" | "warning" | "destructive";
}) {
  const accentClass = {
    primary: "text-primary bg-primary/10",
    cyan: "text-[var(--cyan)] bg-[color-mix(in_oklab,var(--cyan)_15%,transparent)]",
    success: "text-[var(--success)] bg-[color-mix(in_oklab,var(--success)_15%,transparent)]",
    warning: "text-[var(--warning)] bg-[color-mix(in_oklab,var(--warning)_15%,transparent)]",
    destructive: "text-destructive bg-destructive/10",
  }[accent];

  return (
    <div className="card-hover rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", accentClass)}>
          <Icon className="h-4 w-4" />
        </div>
        {typeof trend === "number" && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-mono",
              trend >= 0 ? "text-[var(--success)]" : "text-destructive",
            )}
          >
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold tracking-tight">
        {typeof value === "number" ? formatNumber(value) : value}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
