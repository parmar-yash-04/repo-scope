import { CircleDot, CircleCheck, GitPullRequest, GitMerge, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { IssuesData } from "@/lib/api";
import { StatCard } from "@/components/stat-card";
import { timeAgo } from "@/lib/format";

export function IssuesTab({ data }: { data: IssuesData }) {
  const issueData = [
    { name: "Open", value: data.open_issues, color: "var(--warning)" },
    { name: "Closed", value: data.closed_issues, color: "var(--success)" },
  ];
  const prData = [
    { name: "Merged", value: data.merged_prs, color: "var(--primary)" },
    { name: "Open", value: data.open_prs, color: "var(--cyan)" },
    { name: "Closed", value: data.closed_prs, color: "var(--muted-foreground)" },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={CircleDot} label="Open Issues" value={data.open_issues} accent="warning" />
        <StatCard icon={CircleCheck} label="Closed Issues" value={data.closed_issues} accent="success" />
        <StatCard icon={GitPullRequest} label="Open PRs" value={data.open_prs} accent="cyan" />
        <StatCard icon={GitMerge} label="Merged PRs" value={data.merged_prs} accent="primary" />
        <StatCard icon={Clock} label="Avg close (days)" value={data.avg_close_days} accent="destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Issues — open vs closed" data={issueData} />
        <ChartCard title="Pull request status" data={prData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Recent issues</h3>
          <ul className="divide-y divide-border">
            {data.recent_issues.map((i) => (
              <li key={i.number} className="py-3 flex items-start gap-3">
                {i.state === "open" ? (
                  <CircleDot className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
                ) : (
                  <CircleCheck className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{i.title}</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {i.labels.map((l) => (
                      <span
                        key={l.name}
                        className="rounded-full px-2 py-0.5 text-[10px] font-mono"
                        style={{
                          backgroundColor: `#${l.color}20`,
                          color: `#${l.color}`,
                          border: `1px solid #${l.color}40`,
                        }}
                      >
                        {l.name}
                      </span>
                    ))}
                    <span className="text-[10px] text-muted-foreground font-mono">
                      #{i.number} · {timeAgo(i.created_at)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Recent pull requests</h3>
          <ul className="divide-y divide-border">
            {data.recent_prs.map((p) => (
              <li key={p.number} className="py-3 flex items-start gap-3">
                {p.state === "merged" ? (
                  <GitMerge className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                ) : p.state === "open" ? (
                  <GitPullRequest className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
                ) : (
                  <GitPullRequest className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                  <div className="mt-0.5 text-xs text-muted-foreground font-mono">
                    #{p.number} by {p.user} · {timeAgo(p.created_at)}
                  </div>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-mono uppercase border"
                  style={{
                    color:
                      p.state === "merged"
                        ? "var(--primary)"
                        : p.state === "open"
                          ? "var(--success)"
                          : "var(--destructive)",
                    borderColor: "currentColor",
                  }}
                >
                  {p.state}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: { name: string; value: number; color: string }[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
