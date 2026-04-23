export function formatNumber(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "") + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function parseRepoInput(input: string): { owner: string; name: string } | null {
  const trimmed = input.trim().replace(/\.git$/, "").replace(/\/$/, "");
  if (!trimmed) return null;
  const url = trimmed.match(/github\.com[/:]([^/]+)\/([^/]+)/i);
  if (url) return { owner: url[1], name: url[2] };
  const slash = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (slash) return { owner: slash[1], name: slash[2] };
  return null;
}
