export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export interface TrendingRepo {
  owner: string;
  name: string;
  description: string;
  stars: number;
  forks?: number;
  language: string;
  languageColor: string;
}

export interface RepoOverview {
  owner: string;
  name: string;
  full_name: string;
  description: string;
  avatar_url: string;
  html_url: string;
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  topics: string[];
  license: string | null;
  visibility: "public" | "private";
  default_branch: string;
  homepage: string | null;
  readme: string;
  languages: { name: string; bytes: number; percent: number; color: string }[];
}

export interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface CommitItem {
  sha: string;
  message: string;
  author: string;
  avatar_url: string;
  date: string;
  html_url: string;
}

export interface CommitActivity {
  weekly: { week: string; commits: number }[]; // 52 weeks
  daily: { date: string; count: number }[]; // 52*7 cells
  total_commits: number;
  avg_per_week: number;
  most_active_day: string;
  peak_week: { week: string; commits: number };
  recent: CommitItem[];
}

export interface IssueItem {
  number: number;
  title: string;
  state: "open" | "closed";
  labels: { name: string; color: string }[];
  user: string;
  created_at: string;
}

export interface PullRequest {
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  user: string;
  created_at: string;
}

export interface IssuesData {
  open_issues: number;
  closed_issues: number;
  open_prs: number;
  merged_prs: number;
  closed_prs: number;
  avg_close_days: number;
  recent_issues: IssueItem[];
  recent_prs: PullRequest[];
}

export interface LanguagesData {
  languages: { name: string; bytes: number; percent: number; color: string }[];
}

export interface HealthScore {
  overall: number;
  documentation: number;
  activity: number;
  community: number;
  code_quality: number;
  tips: { area: string; tip: string }[];
}

export interface Dependencies {
  package_manager: string;
  ci_cd: string[];
  has_tests: boolean;
  has_linting: boolean;
  has_docker: boolean;
  dependencies: { name: string; version: string }[];
}

export interface AiSummary {
  what: string;
  tech: string;
  quality: string;
  audience: string;
  verdict: string;
  raw_markdown: string;
}

export async function getRepo(owner: string, name: string): Promise<RepoOverview> {
  const url = `${BASE_URL}/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Failed to fetch repository";
    try {
      const data = await response.json();
      if (data?.detail) message = String(data.detail);
    } catch {
      // Keep fallback message when non-JSON errors are returned.
    }
    throw new Error(message);
  }

  return response.json() as Promise<RepoOverview>;
}

export async function getContributors(owner: string, name: string): Promise<Contributor[]> {
  const url = `${BASE_URL}/contributors/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Failed to fetch contributors";
    try {
      const data = await response.json();
      if (data?.detail) message = String(data.detail);
    } catch {
      // Keep fallback message when non-JSON errors are returned.
    }
    throw new Error(message);
  }

  return response.json() as Promise<Contributor[]>;
}

export async function getCommits(owner: string, name: string): Promise<CommitActivity> {
  const url = `${BASE_URL}/commits/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Failed to fetch commits";
    try {
      const data = await response.json();
      if (data?.detail) message = String(data.detail);
    } catch {
      // Keep fallback message when non-JSON errors are returned.
    }
    throw new Error(message);
  }

  return response.json() as Promise<CommitActivity>;
}

export async function getIssues(owner: string, name: string): Promise<IssuesData> {
  const url = `${BASE_URL}/issues/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Failed to fetch issues";
    try {
      const data = await response.json();
      if (data?.detail) message = String(data.detail);
    } catch {
      // Keep fallback message when non-JSON errors are returned.
    }
    throw new Error(message);
  }

  return response.json() as Promise<IssuesData>;
}

export async function getLanguages(owner: string, name: string): Promise<LanguagesData> {
  const url = `${BASE_URL}/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Failed to fetch languages";
    try {
      const data = await response.json();
      if (data?.detail) message = String(data.detail);
    } catch {
      // Keep fallback message when non-JSON errors are returned.
    }
    throw new Error(message);
  }

  const repo = (await response.json()) as RepoOverview;
  return { languages: repo.languages ?? [] };
}

export async function getHealthScore(owner: string, name: string): Promise<HealthScore> {
  const url = `${BASE_URL}/health-score/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Failed to fetch health score";
    try {
      const data = await response.json();
      if (data?.detail) message = String(data.detail);
    } catch {
      // Keep fallback message when non-JSON errors are returned.
    }
    throw new Error(message);
  }

  return response.json() as Promise<HealthScore>;
}

export async function getDependencies(owner: string, name: string): Promise<Dependencies> {
  const url = `${BASE_URL}/dependencies/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Failed to fetch dependencies";
    try {
      const data = await response.json();
      if (data?.detail) message = String(data.detail);
    } catch {
      // Keep fallback message when non-JSON errors are returned.
    }
    throw new Error(message);
  }

  return response.json() as Promise<Dependencies>;
}

export async function getAiSummary(owner: string, name: string): Promise<AiSummary> {
  const url = `${BASE_URL}/ai-summary/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Failed to fetch AI summary";
    try {
      const data = await response.json();
      if (data?.detail) message = String(data.detail);
    } catch {
      // Keep fallback message when non-JSON errors are returned.
    }
    throw new Error(message);
  }

  return response.json() as Promise<AiSummary>;
}

export async function getTrendingRepos(): Promise<TrendingRepo[]> {
  const url = `${BASE_URL}/trending`;
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Failed to fetch trending repositories";
    try {
      const data = await response.json();
      if (data?.detail) message = String(data.detail);
    } catch {
      // Keep fallback message when non-JSON errors are returned.
    }
    throw new Error(message);
  }

  return response.json() as Promise<TrendingRepo[]>;
}
