export type IssueStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'pr_opened'
  | 'merged'
  | 'pr_closed'
  | 'failed';

// The analysis gate's verdict. '' means the analysis never judged it (it failed,
// or the issue predates the gate) and the issue starts without confirmation.
export type IssueScope = 'small' | 'large' | '';

export type Issue = {
  id: string;
  repo: string;
  title: string;
  description: string;
  prompt: string;
  scope: IssueScope;
  scope_reason: string;
  status: IssueStatus;
  // Pipeline step while running: cloning | fixing | pushing | opening_pr; '' otherwise.
  stage: string;
  pr_url: string;
  error: string;
  created_at: string;
};

export type CreateIssuePayload = {
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
