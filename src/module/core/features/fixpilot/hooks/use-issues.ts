import type { Issue } from '../types';

import { useState, useEffect, useCallback } from 'react';

import { listIssues } from '../api';

// ----------------------------------------------------------------------

const POLL_INTERVAL_MS = 3000;

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIssues(await listIssues());
    } catch {
      // polling errors are transient; next tick retries
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { issues, loading, refresh };
}
