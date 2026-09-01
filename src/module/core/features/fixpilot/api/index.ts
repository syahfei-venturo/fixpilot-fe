import type { Issue, RepoList, RepoTarget, RepoSettings, CreateIssuePayload } from '../types';

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

export async function startIssue(id: string, prompt: string): Promise<Issue> {
  const res = await axios.post<{ data: Issue | null; message: string }>(
    `${endpoints.core.fixpilot.issues}/${id}/start`,
    { prompt }
  );
  if (!res.data.data) throw new Error(res.data.message || 'Failed to start issue');
  return res.data.data;
}

export async function listRecords(id: string): Promise<string[]> {
  const res = await axios.get<{ data: string[] | null }>(
    `${endpoints.core.fixpilot.issues}/${id}/records`
  );
  return res.data.data ?? [];
}

// The record routes are JWT-protected, so a bare <video src> would 401.
// Fetch through the authed axios instance and hand the tag a blob URL.
export async function fetchRecordUrl(id: string, name: string): Promise<string> {
  const res = await axios.get<Blob>(`${endpoints.core.fixpilot.issues}/${id}/records/${name}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(res.data);
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
