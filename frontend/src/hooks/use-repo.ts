import { useQuery } from "@tanstack/react-query";
import {
  apiFetch,
  type ApiError,
  type RepoOverview,
  type Contributor,
  type CommitActivity,
  type IssuesData,
  type HealthScore,
  type Dependencies,
  type AiSummary,
  type TrendingRepo,
} from "@/lib/client";

export function useRepo(owner: string, name: string) {
  return useQuery<RepoOverview, ApiError>({
    queryKey: ["repo", owner, name],
    queryFn: () => apiFetch<RepoOverview>(`/repo/${owner}/${name}`),
  });
}

export function useContributors(owner: string, name: string) {
  return useQuery<Contributor[], ApiError>({
    queryKey: ["contributors", owner, name],
    queryFn: () => apiFetch<Contributor[]>(`/contributors/${owner}/${name}`),
  });
}

export function useCommits(owner: string, name: string) {
  return useQuery<CommitActivity, ApiError>({
    queryKey: ["commits", owner, name],
    queryFn: () => apiFetch<CommitActivity>(`/commits/${owner}/${name}`),
  });
}

export function useIssues(owner: string, name: string) {
  return useQuery<IssuesData, ApiError>({
    queryKey: ["issues", owner, name],
    queryFn: () => apiFetch<IssuesData>(`/issues/${owner}/${name}`),
  });
}

export function useHealthScore(owner: string, name: string) {
  return useQuery<HealthScore, ApiError>({
    queryKey: ["health-score", owner, name],
    queryFn: () => apiFetch<HealthScore>(`/health-score/${owner}/${name}`),
  });
}

export function useDependencies(owner: string, name: string) {
  return useQuery<Dependencies, ApiError>({
    queryKey: ["dependencies", owner, name],
    queryFn: () => apiFetch<Dependencies>(`/dependencies/${owner}/${name}`),
  });
}

export function useAiSummary(owner: string, name: string) {
  return useQuery<AiSummary, ApiError>({
    queryKey: ["ai-summary", owner, name],
    queryFn: () => apiFetch<AiSummary>(`/ai-summary/${owner}/${name}`),
  });
}

export function useTrendingRepos() {
  return useQuery<TrendingRepo[], ApiError>({
    queryKey: ["trending"],
    queryFn: () => apiFetch<TrendingRepo[]>("/trending"),
    staleTime: 15 * 60 * 1000,
  });
}