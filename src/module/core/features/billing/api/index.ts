import type { Plan, BillingTxn, BillingStatus } from '../types';

import axios, { endpoints } from 'src/shared/lib/axios';

// ----------------------------------------------------------------------

export async function getPlans(): Promise<Plan[]> {
  const res = await axios.get<{ data: Plan[] | null }>(endpoints.core.billing.plans);
  return res.data.data ?? [];
}

export async function getBillingStatus(): Promise<BillingStatus> {
  const res = await axios.get<{ data: BillingStatus }>(endpoints.core.billing.status);
  return res.data.data;
}

export async function getBillingHistory(): Promise<BillingTxn[]> {
  const res = await axios.get<{ data: BillingTxn[] | null }>(endpoints.core.billing.history);
  return res.data.data ?? [];
}

export async function subscribe(planCode: string): Promise<BillingStatus> {
  const res = await axios.post<{ data: BillingStatus }>(endpoints.core.billing.subscribe, {
    plan_code: planCode,
  });
  return res.data.data;
}
