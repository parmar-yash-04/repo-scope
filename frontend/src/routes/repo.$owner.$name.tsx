import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import {
  LayoutDashboard, Users, GitCommit, CircleDot, Boxes, Activity, Sparkles, ChevronLeft,
} from "lucide-react";

import { Navbar, Footer } from "@/components/navbar";
import { CardSkel, Skel } from "@/components/skeleton-loader";
import { ErrorCard } from "@/components/error-card";
import {
  getRepo, getContributors, getCommits, getIssues, getHealthScore, getDependencies,
  type RepoOverview, type Contributor, type CommitActivity, type IssuesData, type LanguagesData,
  type HealthScore, type Dependencies,
} from "@/lib/api";
import { pushRecent } from "@/lib/recent";
import { OverviewTab } from "@/components/tabs/overview-tab";
import { ContributorsTab } from "@/components/tabs/contributors-tab";
import { CommitActivityTab } from "@/components/tabs/commits-tab";
import { IssuesTab } from "@/components/tabs/issues-tab";
import { TechStackTab } from "@/components/tabs/tech-stack-tab";
import { HealthTab } from "@/components/tabs/health-tab";
import { AiSummaryTab } from "@/components/tabs/ai-summary-tab";
import { cn } from "@/lib/utils";

const TAB_VALUES = ["overview", "contributors", "commits", "issues", "stack", "health", "ai"] as const;
type TabValue = (typeof TAB_VALUES)[number];

const searchSchema = z.object({
  tab: fallback(z.enum(TAB_VALUES), "overview").default("overview"),
});

export const Route = createFileRoute("/repo/$owner/$name")({
  validateSearch: zodValidator(searchSchema),
  head: ({ params }) => ({
    meta: [
      { title: `${params.owner}/${params.name} — RepoScope` },
      {
        name: "description",
        content: `Analytics, contributors, health score, and AI insights for ${params.owner}/${params.name}.`,
      },
      { property: "og:title", content: `${params.owner}/${params.name} — RepoScope` },
      {
        property: "og:description",
        content: `Analytics, contributors, health score, and AI insights for ${params.owner}/${params.name}.`,
      },
    ],
  }),
  component: RepoPage,
});

const TABS: { value: TabValue; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "contributors", label: "Contributors", icon: Users },
  { value: "commits", label: "Commits", icon: GitCommit },
  { value: "issues", label: "Issues & PRs", icon: CircleDot },
  { value: "stack", label: "Tech Stack", icon: Boxes },
  { value: "health", label: "Health", icon: Activity },
  { value: "ai", label: "AI Summary", icon: Sparkles },
];

interface State {
  loading: boolean;
  error: string | null;
  repo: RepoOverview | null;
  contributors: Contributor[] | null;
  commits: CommitActivity | null;
  issues: IssuesData | null;
  langs: LanguagesData | null;
  health: HealthScore | null;
  deps: Dependencies | null;
}

function RepoPage() {
  const { owner, name } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  const [state, setState] = useState<State>({
    loading: true, error: null,
    repo: null, contributors: null, commits: null, issues: null, langs: null, health: null, deps: null,
  });

  useEffect(() => {
    pushRecent(owner, name);
  }, [owner, name]);

  async function loadAll() {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [repo, contributors, commits, issues, health, deps] = await Promise.all([
        getRepo(owner, name),
        getContributors(owner, name),
        getCommits(owner, name),
        getIssues(owner, name),
        getHealthScore(owner, name),
        getDependencies(owner, name),
      ]);
      const langs: LanguagesData = { languages: repo.languages ?? [] };
      setState({ loading: false, error: null, repo, contributors, commits, issues, langs, health, deps });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : "Failed to load repo" }));
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, name]);

  function setTab(t: TabValue) {
    navigate({ to: ".", params: { owner, name }, search: { tab: t } });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar compact />

      <div className="border-b border-border bg-background/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-2 sm:px-4 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map((t) => {
              const active = t.value === tab;
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6">
        {state.error && (
          <ErrorCard
            title="Repo not found"
            message={state.error}
            onRetry={loadAll}
          />
        )}

        {state.loading && <DashboardSkeleton />}

        {!state.loading && !state.error && state.repo && (
          <>
            {tab === "overview" && state.langs && (
              <OverviewTab repo={state.repo} langs={state.langs} />
            )}
            {tab === "contributors" && state.contributors && (
              <ContributorsTab contributors={state.contributors} />
            )}
            {tab === "commits" && state.commits && (
              <CommitActivityTab data={state.commits} />
            )}
            {tab === "issues" && state.issues && <IssuesTab data={state.issues} />}
            {tab === "stack" && state.deps && state.langs && (
              <TechStackTab deps={state.deps} langs={state.langs} />
            )}
            {tab === "health" && state.health && <HealthTab data={state.health} />}
            {tab === "ai" && <AiSummaryTab owner={owner} name={name} />}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 flex items-start gap-4">
        <Skel className="h-14 w-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skel className="h-5 w-1/3" />
          <Skel className="h-3 w-2/3" />
          <Skel className="h-3 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkel key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardSkel className="lg:col-span-2 h-64" />
        <CardSkel className="h-64" />
      </div>
    </div>
  );
}
