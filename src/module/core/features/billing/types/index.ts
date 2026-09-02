export type PlanCode = 'free' | 'pro' | 'business';

export type Plan = {
  code: PlanCode;
  name: string;
  price: number;
  monthly_quota: number;
  analysis_quota: number;
};

export type BillingStatus = {
  plan_code: PlanCode;
  plan_name: string;
  quota: number;
  used: number;
  remaining: number;
  analysis_quota: number;
  analysis_used: number;
  analysis_remaining: number;
  period: string;
  credit_balance: number;
  fix_cost_credits: number;
  analysis_cost_credits: number;
};

export type BillingTxn = {
  id: string;
  type: 'subscription' | 'topup' | 'usage';
  plan_code: PlanCode | '';
  amount: number;
  credits?: number;
  reason?: 'fix' | 'analysis' | 'topup';
  activated_at: string;
};
