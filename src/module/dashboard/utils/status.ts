import type { IssueStatus } from '../types';

/** Chip colour per FixPilot submission status, shared by the dashboards. */
export const ISSUE_STATUS_COLOR: Record<IssueStatus, 'success' | 'warning' | 'info' | 'error'> = {
  pr_opened: 'success',
  merged: 'success',
  pr_closed: 'warning',
  running: 'info',
  queued: 'warning',
  failed: 'error',
};
