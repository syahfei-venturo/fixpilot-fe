import type { Issue } from '../types';

import { useRef, useState, useEffect, useCallback } from 'react';

import { listIssues } from '../api';

// ----------------------------------------------------------------------

const POLL_INTERVAL_MS = 3000;
// When nothing is running, poll every Nth tick instead of stopping: a teammate
// can start a job in another tab and this one still has to notice.
const IDLE_EVERY_N_TICKS = 10;

/** True while something on the server can still change this row on its own. */
const isPending = (issue: Issue) =>
  issue.status === 'queued' ||
  issue.status === 'running' ||
  // A fresh draft has its prompt written in the background.
  (issue.status === 'draft' && !issue.prompt && !issue.error);

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  // The interval callback is created once, so it reads the live value here
  // instead of a stale copy captured at mount.
  const pending = useRef(true);
  const ticks = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const next = await listIssues();
      pending.current = next.some(isPending);
      setIssues(next);
    } catch {
      // polling errors are transient; next tick retries
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Fast while a job is moving, slow once everything has settled — never off.
    const timer = setInterval(() => {
      ticks.current += 1;
      if (pending.current || ticks.current % IDLE_EVERY_N_TICKS === 0) refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { issues, loading, refresh };
}
