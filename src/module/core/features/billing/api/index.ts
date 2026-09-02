import type { Plan, BillingTxn, BillingStatus } from '../types';

import axios, { endpoints } from 'src/shared/lib/axios';

// ----------------------------------------------------------------------

type ApiEnvelope<T> = {
  data: T | null;
  message: string;
  meta: unknown | null;
  errors: string | null;
};

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await promise;
  const payload = res.data;
  if (payload.data === null || payload.data === undefined) {
    throw new Error(payload.errors || payload.message || 'Empty response');
  }
  return payload.data;
}

async function unwrapOrEmpty<T>(promise: Promise<{ data: ApiEnvelope<T[]> }>): Promise<T[]> {
  const res = await promise;
  return res.data.data ?? [];
}

export function getPlans(): Promise<Plan[]> {
  return unwrapOrEmpty<Plan>(axios.get(endpoints.core.billing.plans));
}

export function getBillingStatus(): Promise<BillingStatus> {
  return unwrap<BillingStatus>(axios.get(endpoints.core.billing.status));
}

export function getBillingHistory(): Promise<BillingTxn[]> {
  return unwrapOrEmpty<BillingTxn>(axios.get(endpoints.core.billing.history));
}

export function subscribe(planCode: string): Promise<BillingStatus> {
  return unwrap<BillingStatus>(
    axios.post(endpoints.core.billing.subscribe, { plan_code: planCode })
  );
}

export function topUp(credits: number): Promise<BillingStatus> {
  return unwrap<BillingStatus>(axios.post(endpoints.core.billing.topup, { credits }));
}
