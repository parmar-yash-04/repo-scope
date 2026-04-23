import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import {
  LayoutDashboard,
  Users,
  GitCommit,
  CircleDot,
  Boxes,
  Activity,
  Sparkles,
  ChevronLeft,
} from "lucide-react";

import { Navbar, Footer } from "@/components/navbar";
import { RepoOverviewSkeleton, CardSkel, StatsSkeleton } from "@/components/skeleton-loader";
import { ErrorCard } from "@/components/error-card";
import {
  useRepo,
  useContributors,
  useCommits,
  useIssues,
  useHealthScore,
  useDependencies,
} from "@/hooks/use-repo";
import { pushRecent } from "@/lib/recent";
import { OverviewTab } from "@/components/tabs/overview-tab";
import { ContributorsTab } from "@/components/tabs/contributors-tab";
import { CommitActivityTab } from "@/components/tabs/commits-tab";
import { IssuesTab } from "@/components/tabs/issues-tab";
import { TechStackTab } from "@/components/tabs/tech-stack-tab";
import { HealthTab } from "@/components/tabs/health-tab";
import { AiSummaryTab } from "@/components/tabs/ai-summary-tab";
import { cn } from "@/lib/utils";

const TAB_VALUES = [
  "overview",
  "contributors",
  "commits",
  "issues",
  "stack",
  "health",
  "ai",
] as const;
type TabValue = (typeof TAB_VALUES)[number];

const searchSchema = z.object({
  tab: fallback(z.enum(TAB_VALUES), "overview").default("overview"),
});

export const Route = createFileRoute("/repo/$owner/$name")({
  validateSearch: zodValidator(searchSchema),
  beforeLoad: ({ params }) => {
    pushRecent(params.owner, params.name);
  },
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

const TABS: {
  value: TabValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "contributors", label: "Contributors", icon: Users },
  { value: "commits", label: "Commits", icon: GitCommit },
  { value: "issues", label: "Issues & PRs", icon: CircleDot },
  { value: "stack", label: "Tech Stack", icon: Boxes },
  { value: "health", label: "Health", icon: Activity },
  { value: "ai", label: "AI Summary", icon: Sparkles },
];

function RepoPage() {
  const { owner, name } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();

  const repo = useRepo(owner, name);
  const contributors = useContributors(owner, name);
  const commits = useCommits(owner, name);
  const issues = useIssues(owner, name);
  const health = useHealthScore(owner, name);
  const deps = useDependencies(owner, name);

  const isLoading = repo.isPending;
  const hasError = repo.isError;
  const errorMessage = repo.error?.message || "Failed to load repository";
  const refetch = repo.refetch;

  function setTab(t: TabValue) {
    navigate({
      to: ".",
      params: { owner, name },
      search: { tab: t },
    });
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
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6">
        {hasError && (
          <ErrorCard
            title="Repository not found"
            message={errorMessage}
            onRetry={refetch}
          />
        )}

        {isLoading && <RepoLoadingState />}

        {!isLoading && !hasError && repo.data && (
          <>
            {tab === "overview" && (
              <OverviewTab repo={repo.data} langs={{ languages: repo.data.languages ?? [] }} />
            )}
            {tab === "contributors" && contributors.data && (
              <ContributorsTab contributors={contributors.data} />
            )}
            {tab === "commits" && commits.data && (
              <CommitActivityTab data={commits.data} />
            )}
            {tab === "issues" && issues.data && <IssuesTab data={issues.data} />}
            {tab === "stack" && deps.data && (
              <TechStackTab deps={deps.data} langs={{ languages: repo.data.languages ?? [] }} />
            )}
            {tab === "health" && health.data && <HealthTab data={health.data} />}
            {tab === "ai" && <AiSummaryTab owner={owner} name={name} />}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function RepoLoadingState() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 flex items-start gap-4">
        <div className="h-14 w-14 rounded-xl bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-1/3 bg-muted animate-pulse rounded" />
          <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
          <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <StatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardSkel className="lg:col-span-2 h-64" />
        <CardSkel className="h-64" />
      </div>
    </div>
  );
}