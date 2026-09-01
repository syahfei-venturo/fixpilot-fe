import type { Overview, FinanceData, ActivityData, MonitoringData } from '../types';

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

export function getOverview(): Promise<Overview> {
  return unwrap<Overview>(axios.get(endpoints.core.dashboard.overview));
}

export function getFinanceDashboard(): Promise<FinanceData> {
  return unwrap<FinanceData>(axios.get(endpoints.core.dashboard.finance));
}

export function getMonitoringDashboard(): Promise<MonitoringData> {
  return unwrap<MonitoringData>(axios.get(endpoints.core.dashboard.monitoring));
}

export function getActivityDashboard(): Promise<ActivityData> {
  return unwrap<ActivityData>(axios.get(endpoints.core.dashboard.activity));
}
