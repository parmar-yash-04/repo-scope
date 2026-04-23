import type { CommitActivity } from "@/lib/api";

export function CommitHeatmap({ daily }: { daily: CommitActivity["daily"] }) {
  // 52 weeks x 7 days. daily is ordered oldest -> newest.
  const weeks: { date: string; count: number }[][] = [];
  for (let w = 0; w < 52; w++) {
    weeks.push(daily.slice(w * 7, w * 7 + 7));
  }
  const max = Math.max(1, ...daily.map((d) => d.count));

  function intensity(count: number): string {
    if (count === 0) return "color-mix(in oklab, var(--muted) 70%, transparent)";
    const t = count / max;
    if (t < 0.25) return "color-mix(in oklab, var(--primary) 25%, transparent)";
    if (t < 0.5) return "color-mix(in oklab, var(--primary) 50%, transparent)";
    if (t < 0.75) return "color-mix(in oklab, var(--primary) 75%, transparent)";
    return "var(--primary)";
  }

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthLabels: { idx: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    if (!week[0]) return;
    const m = new Date(week[0].date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ idx: i, label: months[m] });
      lastMonth = m;
    }
  });

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max font-mono text-[10px]">
        <div className="flex gap-1 pl-7 text-muted-foreground">
          {weeks.map((_, i) => {
            const lbl = monthLabels.find((m) => m.idx === i);
            return (
              <div key={i} className="w-2.5 text-center">
                {lbl?.label?.[0]}
              </div>
            );
          })}
        </div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 pr-1 text-muted-foreground justify-around">
            <span>M</span>
            <span>W</span>
            <span>F</span>
          </div>
          <div className="flex gap-1">
            {weeks.map((week, i) => (
              <div key={i} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, d) => {
                  const cell = week[d];
                  return (
                    <div
                      key={d}
                      className="h-2.5 w-2.5 rounded-[3px]"
                      style={{ backgroundColor: cell ? intensity(cell.count) : "transparent" }}
                      title={cell ? `${cell.date}: ${cell.count} commits` : ""}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pl-7 pt-2 text-muted-foreground">
          <span>Less</span>
          {[0, 0.2, 0.45, 0.7, 1].map((t, i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{
                backgroundColor:
                  t === 0
                    ? "color-mix(in oklab, var(--muted) 70%, transparent)"
                    : `color-mix(in oklab, var(--primary) ${Math.round(t * 100)}%, transparent)`,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
