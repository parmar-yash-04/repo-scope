import { Lightbulb } from "lucide-react";
import type { HealthScore } from "@/lib/api";
import { HealthRing, ScoreBar } from "@/components/health-ring";

export function HealthTab({ data }: { data: HealthScore }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-[color:var(--elevated)] p-8">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[var(--cyan)]/10 blur-[80px]" />
        <div className="relative grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
          <div className="flex justify-center">
            <HealthRing value={data.overall} size={220} stroke={16} />
          </div>
          <div className="space-y-4">
            <ScoreBar label="Documentation" value={data.documentation} />
            <ScoreBar label="Activity" value={data.activity} />
            <ScoreBar label="Community" value={data.community} />
            <ScoreBar label="Code Quality" value={data.code_quality} />
          </div>
        </div>
      </div>

      {data.tips.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-[var(--warning)]" />
            <h3 className="text-sm font-semibold">How to improve your score</h3>
          </div>
          <ul className="space-y-2">
            {data.tips.map((t, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-[color:var(--elevated)] p-3"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider rounded bg-primary/10 px-2 py-1 text-primary shrink-0">
                  {t.area}
                </span>
                <span className="text-sm text-foreground/90">{t.tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Score legend</h3>
        <div className="grid grid-cols-3 gap-3 text-xs font-mono">
          <Legend color="var(--success)" range="80–100" label="Excellent" />
          <Legend color="var(--warning)" range="50–79" label="Needs work" />
          <Legend color="var(--destructive)" range="0–49" label="At risk" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, range, label }: { color: string; range: string; label: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span style={{ color }}>{range}</span>
      </div>
      <div className="text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
