import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, Users, Sparkles, Star, GitFork, History, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Navbar, Footer } from "@/components/navbar";
import { SearchBar } from "@/components/search-bar";
import { RepoCard } from "@/components/repo-card";
import { useTrendingRepos } from "@/hooks/use-repo";
import { getRecent, type RecentItem } from "@/lib/recent";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RepoScope — Analyze any GitHub repository in seconds" },
      {
        name: "description",
        content:
          "Paste a GitHub URL and instantly get contributors, commit activity, tech stack, health score, and an AI summary.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: Activity,
    title: "Activity",
    desc: "Commit graphs, weekly trends and a heatmap of every push.",
    accent: "primary" as const,
  },
  {
    icon: Users,
    title: "Contributors",
    desc: "See who built what, with rankings and contribution charts.",
    accent: "cyan" as const,
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    desc: "A plain-English summary of what a repo does and how good it is.",
    accent: "primary" as const,
  },
];

function Index() {
  const navigate = useNavigate();
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const trendingQuery = useTrendingRepos();

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 280);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function go(owner: string, name: string) {
    navigate({ to: "/repo/$owner/$name", params: { owner, name } });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar compact={scrolled} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-25 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 hero-aurora opacity-70" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-16 pb-8 sm:pt-20 sm:pb-10 text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-mono text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            Live · Powered by GitHub API
          </div>
          <h1 className="mt-5 font-mono text-5xl sm:text-7xl font-bold tracking-tight">
            Repo<span className="text-gradient">Scope</span>
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Analyze any GitHub repository in seconds.
          </p>
          <div className="mt-7 max-w-2xl mx-auto">
            <SearchBar autoFocus onSubmit={go} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-2 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="card-hover rounded-xl border border-border bg-card p-6 animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className={
                    f.accent === "primary"
                      ? "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
                      : "flex h-10 w-10 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--cyan)_15%,transparent)] text-[var(--cyan)]"
                  }
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent searches */}
      {recent.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Recent searches</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <Link
                key={`${r.owner}/${r.name}`}
                to="/repo/$owner/$name"
                params={{ owner: r.owner, name: r.name }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-mono hover:border-primary/50 hover:text-primary transition-colors"
              >
                {r.owner}/{r.name}
                <ArrowRight className="h-3 w-3 opacity-60" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[var(--warning)]" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Trending repos</h2>
          </div>
          {trendingQuery.isRefetching && (
            <span className="text-xs text-muted-foreground">Updating...</span>
          )}
        </div>
        {trendingQuery.isError ? (
          <div className="text-sm text-muted-foreground">Failed to load trending repos</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingQuery.data?.map((r) => (
              <RepoCard
                key={`${r.owner}/${r.name}`}
                owner={r.owner}
                name={r.name}
                description={r.description}
                stars={r.stars}
                forks={r.forks}
                language={r.language}
                languageColor={r.languageColor}
              />
            ))}
          </div>
        )}
        <div className="mt-8 text-center">
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
          >
            <GitFork className="h-4 w-4" /> Want to compare two repos? <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <div className="flex-1" />
      <Footer />
    </div>
  );
}
