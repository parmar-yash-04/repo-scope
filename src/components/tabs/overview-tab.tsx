import { Star, GitFork, Eye, Bug, Calendar, ExternalLink, Globe, Scale, Lock, Unlock } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import type { RepoOverview, LanguagesData } from "@/lib/api";
import { StatCard } from "@/components/stat-card";
import { LanguageBar } from "@/components/language-bar";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { formatDate, timeAgo } from "@/lib/format";

export function OverviewTab({
  repo,
  langs,
}: {
  repo: RepoOverview;
  langs: LanguagesData;
}) {
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <img src={repo.avatar_url} alt={repo.owner} className="h-14 w-14 rounded-xl bg-muted" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xl font-semibold hover:text-primary transition-colors flex items-center gap-1.5"
              >
                {repo.owner}/<span className="text-primary">{repo.name}</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </a>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-mono uppercase">
                {repo.visibility === "public" ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {repo.visibility}
              </span>
              {repo.license && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-mono uppercase">
                  <Scale className="h-3 w-3" /> {repo.license}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{repo.description}</p>
            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-[var(--cyan)] hover:underline"
              >
                <Globe className="h-3 w-3" /> {repo.homepage}
              </a>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {repo.topics.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono text-primary"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Star} label="Stars" value={repo.stars} accent="warning" />
        <StatCard icon={GitFork} label="Forks" value={repo.forks} accent="primary" />
        <StatCard icon={Eye} label="Watchers" value={repo.watchers} accent="cyan" />
        <StatCard icon={Bug} label="Open Issues" value={repo.open_issues} accent="destructive" />
        <StatCard icon={Calendar} label="Last Updated" value={timeAgo(repo.updated_at)} accent="success" />
      </div>

      {/* Languages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Language breakdown</h3>
          <LanguageBar data={langs.languages} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Distribution</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={langs.languages}
                  dataKey="percent"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  stroke="none"
                >
                  {langs.languages.map((l) => (
                    <Cell key={l.name} fill={l.color} />
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
      </div>

      {/* README */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">README.md</h3>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Created {formatDate(repo.created_at)}
          </span>
        </div>
        <MarkdownRenderer>{repo.readme}</MarkdownRenderer>
      </div>
    </div>
  );
}
