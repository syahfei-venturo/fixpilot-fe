import type { Issue, RepoList, RepoTarget, RepoSettings, CreateIssuePayload } from '../types';

import axios, { endpoints } from 'src/shared/lib/axios';

// ----------------------------------------------------------------------

export async function listIssues(): Promise<Issue[]> {
  const res = await axios.get<{ data: Issue[] | null }>(endpoints.core.fixpilot.issues);
  return res.data.data ?? [];
}

// With attachments the payload goes as multipart so the draft and its evidence
// are saved in one roundtrip; without them a plain JSON body keeps things cheap.
export async function createIssue(
  payload: CreateIssuePayload,
  attachments: File[] = []
): Promise<Issue> {
  let body: CreateIssuePayload | FormData = payload;

  if (attachments.length > 0) {
    const form = new FormData();
    form.append('data', JSON.stringify(payload));
    attachments.forEach((file) => form.append('attachments', file));
    body = form;
  }

  const res = await axios.post<{ data: Issue | null; message: string }>(
    endpoints.core.fixpilot.issues,
    body
  );
  if (!res.data.data) throw new Error(res.data.message || 'Failed to create issue');
  return res.data.data;
}

export async function listAttachments(id: string): Promise<string[]> {
  const res = await axios.get<{ data: string[] | null }>(
    `${endpoints.core.fixpilot.issues}/${id}/attachments`
  );
  return res.data.data ?? [];
}

// Same JWT problem as records: fetch through axios and hand back a blob URL.
export async function fetchAttachmentUrl(id: string, name: string): Promise<string> {
  const res = await axios.get<Blob>(`${endpoints.core.fixpilot.issues}/${id}/attachments/${name}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(res.data);
}

export async function startIssue(
  id: string,
  prompt: string,
  confirmLarge = false
): Promise<Issue> {
  const res = await axios.post<{ data: Issue | null; message: string }>(
    `${endpoints.core.fixpilot.issues}/${id}/start`,
    { prompt, confirm_large: confirmLarge }
  );
  if (!res.data.data) throw new Error(res.data.message || 'Failed to start issue');
  return res.data.data;
}

export async function retryIssue(id: string): Promise<Issue> {
  const res = await axios.post<{ data: Issue | null; message: string }>(
    `${endpoints.core.fixpilot.issues}/${id}/retry`
  );
  if (!res.data.data) throw new Error(res.data.message || 'Failed to retry issue');
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
