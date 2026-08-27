export type IssueStatus = 'queued' | 'running' | 'pr_opened' | 'failed';

export type Issue = {
  id: string;
  repo: string;
  title: string;
  description: string;
  status: IssueStatus;
  pr_url: string;
  error: string;
  created_at: string;
};

export type CreateIssuePayload = {
  repo: string;
  title: string;
  description: string;
};
