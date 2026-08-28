export type PlanCode = 'free' | 'pro' | 'business';

export type Plan = {
  code: PlanCode;
  name: string;
  price: number;
  monthly_quota: number;
};

export type BillingStatus = {
  plan_code: PlanCode;
  plan_name: string;
  quota: number;
  used: number;
  remaining: number;
  period: string;
};

export type BillingTxn = {
  id: string;
  plan_code: PlanCode;
  amount: number;
  activated_at: string;
};
