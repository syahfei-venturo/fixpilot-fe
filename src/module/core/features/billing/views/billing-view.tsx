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
import { TopUpDialog } from '../components/topup-dialog';
import { SubscribeConfirmDialog } from '../components/subscribe-confirm-dialog';
import { topUp, getPlans, subscribe, getBillingStatus, getBillingHistory } from '../api';

// ----------------------------------------------------------------------

export function BillingView() {
  const { t } = useTranslate('billing');

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [history, setHistory] = useState<BillingTxn[]>([]);
  const [target, setTarget] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topupOpen, setTopupOpen] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [st, pl, hi] = await Promise.all([getBillingStatus(), getPlans(), getBillingHistory()]);
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

  const handleTopUp = async (credits: number) => {
    setToppingUp(true);
    try {
      const st = await topUp(credits);
      setStatus(st);
      setTopupOpen(false);
      toast.success(t('topup.success', { credits }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.topup'));
    } finally {
      setToppingUp(false);
    }
  };

  const usagePct =
    status && status.quota > 0 ? Math.min(100, (status.used / status.quota) * 100) : 0;

  const analysisPct =
    status && status.analysis_quota > 0
      ? Math.min(100, (status.analysis_used / status.analysis_quota) * 100)
      : 0;

  const showCreditHint =
    !!status && status.remaining === 0 && status.credit_balance >= status.fix_cost_credits;

  const creditFixes =
    status && status.fix_cost_credits > 0
      ? Math.floor(status.credit_balance / status.fix_cost_credits)
      : 0;

  const showCreditWarning =
    !!status && status.remaining === 0 && status.credit_balance < status.fix_cost_credits;

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
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('current.analysisUsage', {
                used: status?.analysis_used ?? 0,
                quota: status?.analysis_quota ?? 0,
                period: status?.period ?? '',
              })}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={analysisPct}
              color={status && status.analysis_remaining === 0 ? 'error' : 'info'}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Stack spacing={0.5}>
              <Typography variant="h6">{t('credits.title')}</Typography>
              <Typography variant="h3">{status?.credit_balance ?? 0}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('credits.worth', { fixes: creditFixes })}
              </Typography>
            </Stack>
            <Button variant="contained" onClick={() => setTopupOpen(true)}>
              {t('credits.topupButton')}
            </Button>
          </Stack>
          {showCreditHint && (
            <Alert
              severity="info"
              sx={{ mt: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => setTopupOpen(true)}>
                  {t('credits.topupButton')}
                </Button>
              }
            >
              {t('credits.hint', { cost: status?.fix_cost_credits ?? 0 })}
            </Alert>
          )}
          {showCreditWarning && (
            <Alert
              severity="warning"
              sx={{ mt: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => setTopupOpen(true)}>
                  {t('credits.topupButton')}
                </Button>
              }
            >
              {t('credits.emptyWarning')}
            </Alert>
          )}
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
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ color: 'text.secondary' }}
                        >
                          {t('plans.perMonth')}
                        </Typography>
                      )}
                    </Typography>
                    {plan.price > 0 && plan.monthly_quota > 0 && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('plans.perFix', {
                          price: formatPrice(Math.round(plan.price / plan.monthly_quota)),
                        })}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('plans.quota', { quota: plan.monthly_quota })}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('plans.analysisQuota', { quota: plan.analysis_quota })}
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
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {txn.type === 'topup'
                      ? t('history.topupRow', { credits: txn.credits ?? 0 })
                      : txn.plan_code}
                  </TableCell>
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

      <TopUpDialog
        open={topupOpen}
        loading={toppingUp}
        onClose={() => setTopupOpen(false)}
        onConfirm={handleTopUp}
      />
    </DashboardContent>
  );
}
