export type IssueStatus = 'queued' | 'running' | 'pr_opened' | 'failed';

export type Issue = {
  id: string;
  repo: string;
  title: string;
  description: string;
  prompt: string;
  status: IssueStatus;
  pr_url: string;
  error: string;
  created_at: string;
};

export type CreateIssuePayload = {
  repo: string;
  title: string;
  description: string;
  prompt: string;
};

export type GeneratePromptPayload = {
  repo: string;
  title: string;
  description: string;
};

export type RepoTarget = {
  id: string;
  full_name: string;
  created_at: string;
};

export type RepoList = {
  items: RepoTarget[];
  effective: string[];
};

export type RepoSettings = {
  configured: boolean;
  token_masked: string;
};
