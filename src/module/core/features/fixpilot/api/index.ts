import type {
  Issue,
  RepoList,
  RepoTarget,
  RepoSettings,
  CreateIssuePayload,
  GeneratePromptPayload,
} from '../types';

import axios, { endpoints } from 'src/shared/lib/axios';

// ----------------------------------------------------------------------

export async function listIssues(): Promise<Issue[]> {
  const res = await axios.get<{ data: Issue[] | null }>(endpoints.core.fixpilot.issues);
  return res.data.data ?? [];
}

export async function createIssue(payload: CreateIssuePayload): Promise<Issue> {
  const res = await axios.post<{ data: Issue | null; message: string }>(
    endpoints.core.fixpilot.issues,
    payload
  );
  if (!res.data.data) throw new Error(res.data.message || 'Failed to create issue');
  return res.data.data;
}

export async function generatePrompt(payload: GeneratePromptPayload): Promise<string> {
  const res = await axios.post<{ data: { prompt: string } | null; message: string }>(
    endpoints.core.fixpilot.prompt,
    payload
  );
  if (!res.data.data?.prompt) throw new Error(res.data.message || 'Failed to draft prompt');
  return res.data.data.prompt;
}

export async function listRepos(): Promise<RepoList> {
  const res = await axios.get<{ data: RepoList | null }>(endpoints.core.fixpilot.repos);
  return res.data.data ?? { items: [], effective: [] };
}

export async function addRepo(fullName: string): Promise<RepoTarget> {
  const res = await axios.post<{ data: RepoTarget | null; message: string }>(
    endpoints.core.fixpilot.repos,
    { full_name: fullName }
  );
  if (!res.data.data) throw new Error(res.data.message || 'Failed to add repo');
  return res.data.data;
}

export async function deleteRepo(id: string): Promise<void> {
  await axios.delete(`${endpoints.core.fixpilot.repos}/${id}`);
}

export async function getRepoSettings(): Promise<RepoSettings> {
  const res = await axios.get<{ data: RepoSettings | null }>(endpoints.core.fixpilot.settings);
  return res.data.data ?? { configured: false, token_masked: '' };
}

export async function setGithubToken(token: string): Promise<RepoSettings> {
  const res = await axios.put<{ data: RepoSettings | null; message: string }>(
    `${endpoints.core.fixpilot.settings}/token`,
    { token }
  );
  if (!res.data.data) throw new Error(res.data.message || 'Failed to save token');
  return res.data.data;
}

export async function deleteGithubToken(): Promise<void> {
  await axios.delete(`${endpoints.core.fixpilot.settings}/token`);
}
