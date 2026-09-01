import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';
import { PageHeader } from 'src/shared/ui/page-header';
import { fDateTime } from 'src/shared/utils/format-time';

import { getFinanceDashboard } from '../../../api';
import { useDashboardData } from '../../../hooks/use-dashboard-data';
import { fNumber, fPercent, fCurrency, fMonthLabel } from '../../../utils/format';
import { KpiCard, ChartCard, ChartEmpty, DashboardState } from '../../../components';

// ----------------------------------------------------------------------

const CHART_H = 340;

export function FinanceDashboardView() {
  const { t } = useTranslate('dashboard');
  const theme = useTheme();
  const { data, loading, error } = useDashboardData(getFinanceDashboard);

  const pieColors = [
    theme.palette.primary.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.success.main,
    theme.palette.error.main,
  ];

  const header = <PageHeader title={t('finance.title')} subtitle={t('finance.subtitle')} />;

  if (!data) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {header}
        <DashboardState loading={loading} error={error} />
      </Box>
    );
  }

  const quotaPct =
    data.quota_limit > 0 ? Math.min(100, (data.quota_used / data.quota_limit) * 100) : 0;
  const remaining = Math.max(0, data.quota_limit - data.quota_used);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {header}

      {/* KPI row */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        }}
      >
        <KpiCard
          title={t('finance.kpi.plan')}
          value={data.plan_name}
          caption={t('finance.caption.plan')}
          icon="solar:case-minimalistic-bold"
          color="primary"
        />
        <KpiCard
          title={t('finance.kpi.monthly')}
          value={fCurrency(data.monthly_amount)}
          caption={t('finance.caption.monthly')}
          icon="solar:wad-of-money-bold"
          color="info"
        />
        <KpiCard
          title={t('finance.kpi.totalPaid')}
          value={fCurrency(data.total_paid)}
          caption={t('finance.caption.totalPaid')}
          icon="solar:bill-list-bold"
          color="success"
        />
        <KpiCard
          title={t('finance.kpi.quota')}
          value={`${fNumber(data.quota_used)} / ${fNumber(data.quota_limit)}`}
          caption={t('finance.caption.quota')}
          icon="solar:chart-square-outline"
          color="warning"
        />
      </Box>

      {/* Row 2: charges per month + plan mix */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <ChartCard
          title={t('finance.charts.payments')}
          subheader={t('finance.charts.paymentsSub')}
          sx={{ gridColumn: { md: 'span 8' } }}
        >
          <BarChart
            height={CHART_H}
            xAxis={[
              { data: data.payment_series.map((p) => fMonthLabel(p.month)), scaleType: 'band' },
            ]}
            series={[
              {
                data: data.payment_series.map((p) => p.amount),
                label: t('finance.series.amount'),
                color: theme.palette.primary.main,
                valueFormatter: (v) => (v === null ? '' : fCurrency(v)),
              },
            ]}
            borderRadius={4}
            margin={{ left: 16, right: 16, top: 24, bottom: 24 }}
          />
        </ChartCard>

        <ChartCard title={t('finance.charts.planMix')} sx={{ gridColumn: { md: 'span 4' } }}>
          {data.plan_mix.length === 0 ? (
            <ChartEmpty text={t('common.empty')} height={CHART_H} />
          ) : (
            <PieChart
              height={CHART_H}
              series={[
                {
                  innerRadius: 64,
                  paddingAngle: 2,
                  cornerRadius: 4,
                  highlightScope: { fade: 'global', highlight: 'item' },
                  data: data.plan_mix.map((p, i) => ({
                    id: i,
                    value: p.amount,
                    label: p.label,
                    color: pieColors[i % pieColors.length],
                  })),
                  valueFormatter: (item) => fCurrency(item.value),
                },
              ]}
              margin={{ top: 16, bottom: 16, left: 16, right: 16 }}
            />
          )}
        </ChartCard>
      </Box>

      {/* Row 3: quota usage + subscription history */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <Card sx={{ gridColumn: { md: 'span 4' } }}>
          <CardHeader title={t('finance.charts.quotaUsage')} />
          <Stack spacing={1.5} sx={{ p: 3 }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">{data.plan_name}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {fNumber(data.quota_used)} / {fNumber(data.quota_limit)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={quotaPct}
              color={quotaPct >= 90 ? 'error' : quotaPct >= 75 ? 'warning' : 'primary'}
              sx={{ height: 8, borderRadius: 1 }}
            />
            <Stack direction="row" spacing={3}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('finance.quota.used')}: {fPercent(quotaPct, 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('finance.quota.remaining')}: {fNumber(remaining)}
              </Typography>
            </Stack>
          </Stack>
        </Card>

        <Card sx={{ gridColumn: { md: 'span 8' } }}>
          <CardHeader title={t('finance.charts.history')} />
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('finance.table.plan')}</TableCell>
                  <TableCell>{t('finance.table.date')}</TableCell>
                  <TableCell align="right">{t('finance.table.amount')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.subscriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>
                      {t('common.empty')}
                    </TableCell>
                  </TableRow>
                )}
                {data.subscriptions.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{s.plan_name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {fDateTime(s.activated_at)}
                    </TableCell>
                    <TableCell align="right">Rp {fNumber(s.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
