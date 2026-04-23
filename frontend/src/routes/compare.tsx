import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip,
} from "recharts";
import { Star, GitFork, Bug, Users, GitCommit, Activity, GitCompareArrows } from "lucide-react";

import { Navbar, Footer } from "@/components/navbar";
import { SearchBar } from "@/components/search-bar";
import { ErrorCard } from "@/components/error-card";
import { CardSkel } from "@/components/skeleton-loader";
import {
  getRepo, getContributors, getCommits, getHealthScore,
  type RepoOverview, type HealthScore,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RepoBundle {
  repo: RepoOverview;
  contributors: number;
  commits: number;
  health: HealthScore;
}

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare repositories — RepoScope" },
      { name: "description", content: "Compare two GitHub repositories side by side: stars, forks, issues, contributors, commits, and health." },
      { property: "og:title", content: "Compare repositories — RepoScope" },
      { property: "og:description", content: "Side-by-side GitHub repo comparison with a multi-axis radar chart." },
    ],
  }),
  component: ComparePage,
});

async function loadBundle(owner: string, name: string): Promise<RepoBundle> {
  const [repo, contributors, commits, health] = await Promise.all([
    getRepo(owner, name),
    getContributors(owner, name),
    getCommits(owner, name),
    getHealthScore(owner, name),
  ]);
  return { repo, contributors: contributors.length, commits: commits.total_commits, health };
}

function ComparePage() {
  const [a, setA] = useState<RepoBundle | null>(null);
  const [b, setB] = useState<RepoBundle | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errA, setErrA] = useState<string | null>(null);
  const [errB, setErrB] = useState<string | null>(null);

  async function pick(side: "a" | "b", owner: string, name: string) {
    if (side === "a") {
      setLoadingA(true); setErrA(null);
      try { setA(await loadBundle(owner, name)); }
      catch (e) { setErrA(e instanceof Error ? e.message : "Failed to load"); }
      finally { setLoadingA(false); }
    } else {
      setLoadingB(true); setErrB(null);
      try { setB(await loadBundle(owner, name)); }
      catch (e) { setErrB(e instanceof Error ? e.message : "Failed to load"); }
      finally { setLoadingB(false); }
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pt-12 pb-6 text-center">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
          <GitCompareArrows className="h-5 w-5" />
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight">
          Compare two repositories
        </h1>
        <p className="mt-2 text-muted-foreground">Pick two repos to see how they stack up across key metrics.</p>
      </section>

      <main className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-6 pb-12 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Repo A</label>
            <SearchBar onSubmit={(o, n) => pick("a", o, n)} />
            {loadingA && <CardSkel />}
            {errA && <ErrorCard message={errA} />}
            {a && !loadingA && <RepoSummary bundle={a} />}
          </div>
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Repo B</label>
            <SearchBar onSubmit={(o, n) => pick("b", o, n)} />
            {loadingB && <CardSkel />}
            {errB && <ErrorCard message={errB} />}
            {b && !loadingB && <RepoSummary bundle={b} />}
          </div>
        </div>

        {a && b && <ComparisonView a={a} b={b} />}
      </main>

      <Footer />
    </div>
  );
}

function RepoSummary({ bundle }: { bundle: RepoBundle }) {
  const r = bundle.repo;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <img src={r.avatar_url} alt={r.owner} className="h-10 w-10 rounded-lg bg-muted" />
        <div className="min-w-0">
          <div className="font-mono text-sm font-semibold truncate">
            {r.owner}/<span className="text-primary">{r.name}</span>
          </div>
          <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>
        </div>
      </div>
    </div>
  );
}

function ComparisonView({ a, b }: { a: RepoBundle; b: RepoBundle }) {
  const metrics: { label: string; icon: React.ComponentType<{ className?: string }>; av: number; bv: number; higherIsBetter: boolean }[] = [
    { label: "Stars", icon: Star, av: a.repo.stars, bv: b.repo.stars, higherIsBetter: true },
    { label: "Forks", icon: GitFork, av: a.repo.forks, bv: b.repo.forks, higherIsBetter: true },
    { label: "Open Issues", icon: Bug, av: a.repo.open_issues, bv: b.repo.open_issues, higherIsBetter: false },
    { label: "Contributors", icon: Users, av: a.contributors, bv: b.contributors, higherIsBetter: true },
    { label: "Commits (52w)", icon: GitCommit, av: a.commits, bv: b.commits, higherIsBetter: true },
    { label: "Health Score", icon: Activity, av: a.health.overall, bv: b.health.overall, higherIsBetter: true },
  ];

  const radarData = [
    { axis: "Docs", a: a.health.documentation, b: b.health.documentation },
    { axis: "Activity", a: a.health.activity, b: b.health.activity },
    { axis: "Community", a: a.health.community, b: b.health.community },
    { axis: "Quality", a: a.health.code_quality, b: b.health.code_quality },
    { axis: "Overall", a: a.health.overall, b: b.health.overall },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3 border-b border-border bg-[color:var(--elevated)]">
          <div className="font-mono text-sm font-semibold truncate">{a.repo.full_name}</div>
          <div className="text-xs font-mono text-muted-foreground px-3">vs</div>
          <div className="font-mono text-sm font-semibold truncate text-right">{b.repo.full_name}</div>
        </div>
        <ul>
          {metrics.map((m) => {
            const aWins = m.higherIsBetter ? m.av > m.bv : m.av < m.bv;
            const bWins = m.higherIsBetter ? m.bv > m.av : m.bv < m.av;
            return (
              <li key={m.label} className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3 border-b border-border last:border-b-0">
                <div
                  className={cn(
                    "font-mono text-base text-right pr-4 px-2 py-1 rounded-md",
                    aWins && "bg-[color-mix(in_oklab,var(--success)_15%,transparent)] text-[var(--success)]",
                  )}
                >
                  {formatNumber(m.av)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono px-3 whitespace-nowrap">
                  <m.icon className="h-3.5 w-3.5" />
                  {m.label}
                </div>
                <div
                  className={cn(
                    "font-mono text-base pl-4 px-2 py-1 rounded-md",
                    bWins && "bg-[color-mix(in_oklab,var(--success)_15%,transparent)] text-[var(--success)]",
                  )}
                >
                  {formatNumber(m.bv)}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Health radar — 5 dimensions</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
              <Radar name={a.repo.full_name} dataKey="a" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.3} />
              <Radar name={b.repo.full_name} dataKey="b" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.3} />
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
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
