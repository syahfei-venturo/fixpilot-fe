import type { Company, CompanyListParams } from '../types';

import i18n from 'i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { useAuthContext } from 'src/module/core/features/auth/hooks/use-auth-context';

import { listCompaniesTrash, listCompaniesPaginated } from '../api';

// ----------------------------------------------------------------------

type Meta = { page: number; limit: number; total: number; total_pages: number };

type State = { data: Company[]; meta: Meta; loading: boolean; error: string | null };

const INITIAL_META: Meta = { page: 1, limit: 25, total: 0, total_pages: 0 };

export function useCompanyList(params: CompanyListParams, trashMode: boolean) {
  const { companyVersion } = useAuthContext();
  const key = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableParams = useMemo(() => params, [key]);

  const [state, setState] = useState<State>({
    data: [],
    meta: INITIAL_META,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      if (trashMode) {
        const data = await listCompaniesTrash();
        setState({
          data,
          meta: { page: 1, limit: data.length, total: data.length, total_pages: 1 },
          loading: false,
          error: null,
        });
      } else {
        const result = await listCompaniesPaginated(stableParams);
        setState({ data: result.data, meta: result.meta, loading: false, error: null });
      }
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : i18n.t('companies:errors.loadData'),
      }));
    }
  }, [stableParams, trashMode]);

  useEffect(() => {
    load();
  }, [load, companyVersion]);

  return { ...state, refresh: load };
}
