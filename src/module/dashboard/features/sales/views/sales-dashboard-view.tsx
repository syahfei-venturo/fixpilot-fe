import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';
import { PageHeader } from 'src/shared/ui/page-header';

import { getActivityDashboard } from '../../../api';
import { useDashboardData } from '../../../hooks/use-dashboard-data';
import { fNumber, fPercent, fMonthLabel } from '../../../utils/format';
import { KpiCard, ChartCard, ChartEmpty, DashboardState } from '../../../components';

// ----------------------------------------------------------------------

const CHART_H = 340;

export function SalesDashboardView() {
  const { t } = useTranslate('dashboard');
  const theme = useTheme();
  const { data, loading, error } = useDashboardData(getActivityDashboard);

  const header = <PageHeader title={t('sales.title')} subtitle={t('sales.subtitle')} />;

  if (!data) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {header}
        <DashboardState loading={loading} error={error} />
      </Box>
    );
  }

  const pieColors = [
    theme.palette.primary.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.success.main,
    theme.palette.error.main,
  ];

  const funnelTop = data.funnel[0]?.count ?? 0;

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
          title={t('sales.kpi.fixes')}
          value={fNumber(data.fixes_this_month)}
          caption={t('sales.caption.fixes')}
          icon="solar:restart-bold"
          color="primary"
          spark={data.monthly.map((m) => m.count)}
        />
        <KpiCard
          title={t('sales.kpi.repos')}
          value={fNumber(data.repos)}
          caption={t('sales.caption.repos')}
          icon="solar:add-folder-bold"
          color="info"
        />
        <KpiCard
          title={t('sales.kpi.users')}
          value={fNumber(data.active_users)}
          caption={t('sales.caption.users')}
          icon="solar:users-group-rounded-bold"
          color="warning"
        />
        <KpiCard
          title={t('sales.kpi.successRate')}
          value={fPercent(data.success_rate)}
          caption={t('sales.caption.successRate')}
          icon="solar:shield-check-bold"
          color="success"
        />
      </Box>

      {/* Row 2: monthly trend + repo mix */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <ChartCard
          title={t('sales.charts.monthly')}
          subheader={t('sales.charts.monthlySub')}
          sx={{ gridColumn: { md: 'span 8' } }}
        >
          <LineChart
            height={CHART_H}
            xAxis={[{ data: data.monthly.map((m) => fMonthLabel(m.month)), scaleType: 'point' }]}
            series={[
              {
                data: data.monthly.map((m) => m.count),
                label: t('sales.series.fixes'),
                color: theme.palette.primary.main,
                area: true,
                showMark: false,
                curve: 'natural',
              },
            ]}
            margin={{ left: 16, right: 24, top: 24, bottom: 24 }}
            sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.12 } }}
          />
        </ChartCard>

        <ChartCard title={t('sales.charts.byRepo')} sx={{ gridColumn: { md: 'span 4' } }}>
          {data.by_repo.length === 0 ? (
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
                  data: data.by_repo.slice(0, 5).map((r, i) => ({
                    id: i,
                    value: r.total,
                    label: r.repo,
                    color: pieColors[i % pieColors.length],
                  })),
                },
              ]}
              margin={{ top: 16, bottom: 16, left: 16, right: 16 }}
            />
          )}
        </ChartCard>
      </Box>

      {/* Row 3: funnel + top repositories */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <Card sx={{ gridColumn: { md: 'span 6' } }}>
          <CardHeader title={t('sales.charts.funnel')} subheader={t('sales.charts.funnelSub')} />
          <Stack spacing={2.5} sx={{ p: 3 }}>
            {data.funnel.map((step) => {
              const pct = funnelTop > 0 ? (step.count / funnelTop) * 100 : 0;
              return (
                <Box key={step.label}>
                  <Stack
                    direction="row"
                    sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography variant="subtitle2">{t(`sales.funnel.${step.label}`)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {fNumber(step.count)} · {fPercent(pct, 0)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              );
            })}
          </Stack>
        </Card>

        <Card sx={{ gridColumn: { md: 'span 6' } }}>
          <CardHeader title={t('sales.charts.topRepos')} />
          <Stack spacing={2.5} sx={{ p: 3 }}>
            {data.by_repo.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('common.empty')}
              </Typography>
            )}
            {data.by_repo.slice(0, 5).map((r) => (
              <Box key={r.repo}>
                <Stack
                  direction="row"
                  sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="subtitle2" noWrap sx={{ minWidth: 0 }}>
                    {r.repo}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                    {fNumber(r.total)} · {fPercent(r.success_rate, 0)}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={r.success_rate}
                  color={
                    r.success_rate >= 75 ? 'success' : r.success_rate >= 40 ? 'warning' : 'error'
                  }
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            ))}
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
