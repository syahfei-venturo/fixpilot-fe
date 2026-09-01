import { useState, useEffect } from 'react';

// ----------------------------------------------------------------------

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

/**
 * Loads one dashboard payload once per mount. `fetcher` must be a stable
 * module-level function — the hook intentionally does not re-run on identity
 * changes so inline arrow functions cannot cause a fetch loop.
 */
export function useDashboardData<T>(fetcher: () => Promise<T>): State<T> {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;

    fetcher()
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ data: null, loading: false, error: message });
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
