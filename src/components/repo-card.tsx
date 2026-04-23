import { Link } from "@tanstack/react-router";
import { Star, GitFork } from "lucide-react";
import { formatNumber } from "@/lib/format";

export function RepoCard({
  owner,
  name,
  description,
  stars,
  forks,
  language,
  languageColor,
}: {
  owner: string;
  name: string;
  description?: string;
  stars?: number;
  forks?: number;
  language?: string;
  languageColor?: string;
}) {
  return (
    <Link
      to="/repo/$owner/$name"
      params={{ owner, name }}
      className="card-hover group block rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2">
        <img
          src={`https://github.com/${owner}.png`}
          alt={owner}
          className="h-6 w-6 rounded-full bg-muted"
          loading="lazy"
        />
        <span className="font-mono text-sm text-muted-foreground">{owner} /</span>
        <span className="font-mono text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {name}
        </span>
      </div>
      {description && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{description}</p>
      )}
      <div className="mt-4 flex items-center gap-4 text-xs font-mono text-muted-foreground">
        {language && (
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: languageColor || "#888" }}
            />
            {language}
          </span>
        )}
        {typeof stars === "number" && (
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5" />
            {formatNumber(stars)}
          </span>
        )}
        {typeof forks === "number" && (
          <span className="flex items-center gap-1">
            <GitFork className="h-3.5 w-3.5" />
            {formatNumber(forks)}
          </span>
        )}
      </div>
    </Link>
  );
}
