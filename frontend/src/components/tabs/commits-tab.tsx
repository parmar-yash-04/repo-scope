import { GitCommit, TrendingUp, Calendar, Zap } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Area, AreaChart,
} from "recharts";
import type { CommitActivity } from "@/lib/api";
import { StatCard } from "@/components/stat-card";
import { CommitHeatmap } from "@/components/commit-heatmap";
import { formatDate, timeAgo } from "@/lib/format";

export function CommitActivityTab({ data }: { data: CommitActivity }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={GitCommit} label="Total commits (52w)" value={data.total_commits} accent="primary" />
        <StatCard icon={TrendingUp} label="Avg / week" value={data.avg_per_week} accent="cyan" />
        <StatCard icon={Calendar} label="Most active day" value={data.most_active_day} accent="success" />
        <StatCard icon={Zap} label="Peak week" value={data.peak_week.commits} accent="warning" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Commits over the last 52 weeks</h3>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">weekly</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.weekly}>
              <defs>
                <linearGradient id="commits-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={10} fontFamily="var(--font-mono)" tickFormatter={(v) => v.slice(5)} interval={6} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} fontFamily="var(--font-mono)" />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="commits" stroke="var(--primary)" strokeWidth={2} fill="url(#commits-grad)" />
              <Line type="monotone" dataKey="commits" stroke="var(--cyan)" strokeWidth={0} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Contribution heatmap</h3>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">last year</span>
        </div>
        <CommitHeatmap daily={data.daily} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Recent commits</h3>
        <ul className="divide-y divide-border">
          {data.recent.map((c) => (
            <li key={c.sha} className="py-3 flex items-start gap-3">
              <img src={c.avatar_url} alt={c.author} className="h-6 w-6 rounded-full bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <a
                  href={c.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
                >
                  {c.message}
                </a>
                <div className="mt-0.5 text-xs text-muted-foreground font-mono">
                  <span className="text-foreground/80">{c.author}</span> · {timeAgo(c.date)} · {formatDate(c.date)}
                </div>
              </div>
              <a
                href={c.html_url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground hover:text-primary"
              >
                {c.sha.slice(0, 7)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
