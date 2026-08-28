import type { Plan, BillingTxn, BillingStatus } from '../types';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import { fDateTime } from 'src/shared/utils/format-time';

import { formatPrice } from './format-price';
import { SubscribeConfirmDialog } from '../components/subscribe-confirm-dialog';
import { getPlans, subscribe, getBillingStatus, getBillingHistory } from '../api';

// ----------------------------------------------------------------------

export function BillingView() {
  const { t } = useTranslate('billing');

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [history, setHistory] = useState<BillingTxn[]>([]);
  const [target, setTarget] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [st, pl, hi] = await Promise.all([
        getBillingStatus(),
        getPlans(),
        getBillingHistory(),
      ]);
      setStatus(st);
      setPlans(pl);
      setHistory(hi);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.load'));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubscribe = async () => {
    if (!target) return;
    setSaving(true);
    try {
      const st = await subscribe(target.code);
      setStatus(st);
      setTarget(null);
      toast.success(t('feedback.subscribed', { name: target.name }));
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.subscribe'));
    } finally {
      setSaving(false);
    }
  };

  const usagePct =
    status && status.quota > 0 ? Math.min(100, (status.used / status.quota) * 100) : 0;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title={t('title')} />

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Card sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="h6">{t('current.title')}</Typography>
              <Chip size="small" color="primary" label={status?.plan_name ?? '—'} />
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('current.usage', {
                used: status?.used ?? 0,
                quota: status?.quota ?? 0,
                period: status?.period ?? '',
              })}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={usagePct}
              color={status && status.remaining === 0 ? 'error' : 'primary'}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Stack>
        </Card>

        <Grid container spacing={3}>
          {plans.map((plan) => {
            const isActive = plan.code === status?.plan_code;
            return (
              <Grid key={plan.code} size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    p: 3,
                    height: 1,
                    ...(isActive && {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                      borderStyle: 'solid',
                    }),
                  }}
                >
                  <Stack spacing={1.5} sx={{ height: 1 }}>
                    <Typography variant="h6">{plan.name}</Typography>
                    <Typography variant="h4">
                      {plan.price === 0 ? t('plans.freePrice') : formatPrice(plan.price)}
                      {plan.price > 0 && (
                        <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('plans.perMonth')}
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('plans.quota', { quota: plan.monthly_quota })}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                      variant={isActive ? 'outlined' : 'contained'}
                      disabled={isActive}
                      onClick={() => setTarget(plan)}
                    >
                      {isActive ? t('plans.current') : t('plans.choose')}
                    </Button>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Card>
          <Typography variant="h6" sx={{ p: 3, pb: 1 }}>
            {t('history.title')}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('history.plan')}</TableCell>
                <TableCell>{t('history.amount')}</TableCell>
                <TableCell>{t('history.date')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {t('history.empty')}
                  </TableCell>
                </TableRow>
              )}
              {history.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{txn.plan_code}</TableCell>
                  <TableCell>{formatPrice(txn.amount)}</TableCell>
                  <TableCell>{fDateTime(txn.activated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Stack>

      <SubscribeConfirmDialog
        open={!!target}
        plan={target}
        loading={saving}
        onClose={() => setTarget(null)}
        onConfirm={handleSubscribe}
      />
    </DashboardContent>
  );
}
