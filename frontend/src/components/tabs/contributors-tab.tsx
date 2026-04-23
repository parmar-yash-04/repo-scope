import { ExternalLink, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import type { Contributor } from "@/lib/api";
import { StatCard } from "@/components/stat-card";
import { formatNumber } from "@/lib/format";

const PALETTE = [
  "#3b82f6", "#06b6d4", "#22c55e", "#f59e0b", "#a855f7",
  "#ef4444", "#10b981", "#eab308", "#ec4899", "#8b5cf6",
];

export function ContributorsTab({ contributors }: { contributors: Contributor[] }) {
  const top = contributors.slice(0, 10);
  const totalContrib = contributors.reduce((s, c) => s + c.contributions, 0);
  const pieData = top.map((c) => ({ name: c.login, value: c.contributions }));

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard icon={Users} label="Total Contributors" value={contributors.length} accent="primary" />
        <StatCard icon={Users} label="Total Commits" value={totalContrib} accent="cyan" />
        <StatCard icon={Users} label="Top Contributor" value={top[0]?.login ?? "—"} accent="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Commits per contributor</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} fontFamily="var(--font-mono)" />
                <YAxis dataKey="login" type="category" stroke="var(--muted-foreground)" fontSize={11} width={80} fontFamily="var(--font-mono)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="contributions" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Contribution share</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2} stroke="none">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
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
                <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Top 10 contributors</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {top.map((c, i) => (
            <a
              key={c.login}
              href={c.html_url}
              target="_blank"
              rel="noreferrer"
              className="card-hover flex items-center gap-3 rounded-lg border border-border bg-[color:var(--elevated)] p-3"
            >
              <span className="font-mono text-xs text-muted-foreground w-5 text-center">#{i + 1}</span>
              <img src={c.avatar_url} alt={c.login} className="h-9 w-9 rounded-full bg-muted" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-medium truncate">{c.login}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {formatNumber(c.contributions)} commits
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
