import type { Issue, CreateIssuePayload, GeneratePromptPayload } from '../types';

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
