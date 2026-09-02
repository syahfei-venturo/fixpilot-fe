// Payload shapes returned by /core/v1/dashboard/*. Every number is derived
// from real company-scoped rows (FixPilot submissions, subscriptions, members).

export type IssueStatus = 'queued' | 'running' | 'pr_opened' | 'merged' | 'pr_closed' | 'failed';

export type ActivityItem = {
  title: string;
  repo: string;
  status: IssueStatus;
  created_at: string;
};

export type Overview = {
  plan_code: string;
  plan_name: string;
  monthly_amount: number;
  fixes_this_month: number;
  success_rate: number;
  active_users: number;
  activity: ActivityItem[];
};

export type MonthAmount = { month: string; amount: number };
export type MonthCount = { month: string; count: number };
export type LabelValue = { label: string; count: number; amount: number };

export type SubscriptionRow = {
  id: string;
  plan_code: string;
  plan_name: string;
  amount: number;
  activated_at: string;
};

export type FinanceData = {
  plan_code: string;
  plan_name: string;
  monthly_amount: number;
  total_paid: number;
  quota_used: number;
  quota_limit: number;
  payment_series: MonthAmount[];
  plan_mix: LabelValue[];
  subscriptions: SubscriptionRow[];
};

export type DailyRuns = {
  date: string;
  succeeded: number;
  failed: number;
  pending: number;
};

export type RepoHealth = {
  repo: string;
  total: number;
  succeeded: number;
  failed: number;
  success_rate: number;
  last_run: string | null;
};

export type MonitoringData = {
  total: number;
  succeeded: number;
  failed: number;
  pending: number;
  success_rate: number;
  daily: DailyRuns[];
  status_mix: LabelValue[];
  repos: RepoHealth[];
};

export type ActivityData = {
  active_users: number;
  repos: number;
  fixes_this_month: number;
  success_rate: number;
  monthly: MonthCount[];
  by_repo: RepoHealth[];
  funnel: LabelValue[];
};
