import { useState } from "react";
import { Sparkles, RefreshCcw, Wand2 } from "lucide-react";
import { getAiSummary, type AiSummary } from "@/lib/api";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Skel } from "@/components/skeleton-loader";
import { Button } from "@/components/ui/button";

export function AiSummaryTab({ owner, name }: { owner: string; name: string }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AiSummary | null>(null);

  async function run() {
    setLoading(true);
    try {
      const r = await getAiSummary(owner, name);
      setSummary(r);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {!summary && !loading && (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-12 text-center">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-primary/20 blur-[80px]" />
          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary glow-primary">
              <Wand2 className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">Generate an AI summary</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              Get a plain-English breakdown of what this repo does, the tech behind it, code quality, and who it's for.
            </p>
            <Button onClick={run} className="mt-6 font-mono">
              <Sparkles className="h-4 w-4" />
              Generate AI Summary
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-border bg-card p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-mono">Analyzing repository…</span>
          </div>
          <Skel className="h-5 w-1/3" />
          <Skel className="h-3 w-full" />
          <Skel className="h-3 w-11/12" />
          <Skel className="h-3 w-9/12" />
          <Skel className="h-5 w-1/4 mt-6" />
          <Skel className="h-3 w-full" />
          <Skel className="h-3 w-10/12" />
          <Skel className="h-5 w-1/4 mt-6" />
          <Skel className="h-3 w-full" />
          <Skel className="h-3 w-8/12" />
        </div>
      )}

      {summary && !loading && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-[color:var(--elevated)]">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-mono">AI summary · {owner}/{name}</span>
            </div>
            <Button onClick={run} variant="ghost" size="sm" className="font-mono">
              <RefreshCcw className="h-3.5 w-3.5" /> Regenerate
            </Button>
          </div>
          <div className="p-6">
            <MarkdownRenderer>{summary.raw_markdown}</MarkdownRenderer>
          </div>
        </div>
      )}
    </div>
  );
}
