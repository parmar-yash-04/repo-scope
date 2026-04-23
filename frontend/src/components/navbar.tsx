import { Link, useNavigate } from "@tanstack/react-router";
import { Github, GitCompareArrows, Moon, Sun, Terminal } from "lucide-react";
import { useTheme } from "./theme-provider";
import { SearchBar } from "./search-bar";
import { Button } from "./ui/button";

export function Navbar({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const githubLoginUrl = `${apiBase}/auth/github/login`;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <Terminal className="h-4 w-4" />
          </div>
          <span className="font-mono text-base font-semibold tracking-tight">
            Repo<span className="text-gradient">Scope</span>
          </span>
        </Link>

        {compact && (
          <div className="hidden md:flex flex-1 max-w-xl mx-auto">
            <SearchBar
              compact
              onSubmit={(o, n) => navigate({ to: "/repo/$owner/$name", params: { owner: o, name: n } })}
            />
          </div>
        )}
        {!compact && <div className="flex-1" />}

        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="font-mono text-xs">
            <Link to="/compare">
              <GitCompareArrows className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="GitHub">
            <a href={githubLoginUrl}>
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground font-mono">
        <span>Powered by Parmar Yash</span>
        <span>© {new Date().getFullYear()} RepoScope</span>
      </div>
    </footer>
  );
}
