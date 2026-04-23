import { env } from "./env";

export const BASE_URL = env.VITE_API_URL || "http://localhost:8000/api";

export const API_TIMEOUT_MS = 15000;

export const RETRY_COUNT = 3;

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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
  weekly: { week: string; commits: number }[];
  daily: { date: string; count: number }[];
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

async function handleResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (data?.detail) message = String(data.detail);
    } catch {}

    throw new ApiError(message, response.status, endpoint);
  }

  return response.json() as Promise<T>;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return handleResponse<T>(response, endpoint);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out", 408, endpoint);
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      0,
      endpoint
    );
  }
}