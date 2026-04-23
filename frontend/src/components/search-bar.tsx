import { useEffect, useRef, useState } from "react";
import { Search, History, ArrowRight, X } from "lucide-react";
import { parseRepoInput } from "@/lib/format";
import { getRecent, type RecentItem } from "@/lib/recent";
import { cn } from "@/lib/utils";

export function SearchBar({
  onSubmit,
  compact = false,
  autoFocus = false,
}: {
  onSubmit: (owner: string, name: string) => void;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(raw: string) {
    const parsed = parseRepoInput(raw);
    if (!parsed) {
      setError("Use 'owner/repo' or a github.com URL");
      return;
    }
    setError(null);
    setOpen(false);
    onSubmit(parsed.owner, parsed.name);
  }

  return (
    <div ref={ref} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className={cn(
          "relative flex items-center gap-2 rounded-xl border border-border bg-card transition-all",
          compact ? "h-10 px-3" : "h-14 px-4 shadow-2xl",
          open && !compact && "glow-primary",
        )}
      >
        <Search className={cn("text-muted-foreground shrink-0", compact ? "h-4 w-4" : "h-5 w-5")} />
        <input
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={compact ? "owner/repo" : "Enter GitHub repo URL or owner/repo"}
          className={cn(
            "flex-1 bg-transparent outline-none placeholder:text-muted-foreground font-mono",
            compact ? "text-sm" : "text-base",
          )}
        />
        {value && (
          <button type="button" onClick={() => setValue("")} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className={cn(
            "flex items-center gap-1.5 rounded-lg bg-primary px-3 text-primary-foreground transition-opacity hover:opacity-90 font-medium",
            compact ? "h-7 text-xs" : "h-10 text-sm",
          )}
        >
          {compact ? <ArrowRight className="h-3.5 w-3.5" /> : <>Analyze<ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-destructive font-mono">{error}</p>}

      {open && recent.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-popover shadow-2xl overflow-hidden animate-fade-in">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
            Recent
          </div>
          {recent.map((r) => (
            <button
              key={`${r.owner}/${r.name}`}
              type="button"
              onClick={() => submit(`${r.owner}/${r.name}`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent text-left text-sm font-mono"
            >
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground">{r.owner}/<span className="text-primary">{r.name}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
