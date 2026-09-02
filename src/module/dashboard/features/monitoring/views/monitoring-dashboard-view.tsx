import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { PageHeader } from 'src/shared/ui/page-header';
import { fDateTime } from 'src/shared/utils/format-time';

import { getMonitoringDashboard } from '../../../api';
import { useDashboardData } from '../../../hooks/use-dashboard-data';
import { fNumber, fPercent, fDayLabel } from '../../../utils/format';
import { KpiCard, ChartCard, ChartEmpty, DashboardState } from '../../../components';

// ----------------------------------------------------------------------

const CHART_H = 340;

export function MonitoringDashboardView() {
  const { t } = useTranslate('dashboard');
  const theme = useTheme();
  const { data, loading, error } = useDashboardData(getMonitoringDashboard);

  const header = <PageHeader title={t('monitoring.title')} subtitle={t('monitoring.subtitle')} />;

  if (!data) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {header}
        <DashboardState loading={loading} error={error} />
      </Box>
    );
  }

  const days = data.daily.map((d) => fDayLabel(d.date));
  const statusPalette: Record<string, string> = {
    pr_opened: theme.palette.success.main,
    merged: theme.palette.success.dark,
    pr_closed: theme.palette.warning.dark,
    running: theme.palette.info.main,
    queued: theme.palette.warning.main,
    failed: theme.palette.error.main,
  };

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
          title={t('monitoring.kpi.total')}
          value={fNumber(data.total)}
          caption={t('monitoring.caption.total')}
          icon="solar:restart-bold"
          color="primary"
          spark={data.daily.map((d) => d.succeeded + d.failed + d.pending)}
        />
        <KpiCard
          title={t('monitoring.kpi.succeeded')}
          value={fNumber(data.succeeded)}
          caption={t('monitoring.caption.succeeded')}
          icon="solar:check-circle-bold"
          color="success"
          spark={data.daily.map((d) => d.succeeded)}
        />
        <KpiCard
          title={t('monitoring.kpi.failed')}
          value={fNumber(data.failed)}
          caption={t('monitoring.caption.failed')}
          icon="solar:danger-triangle-bold"
          color="error"
          spark={data.daily.map((d) => d.failed)}
        />
        <KpiCard
          title={t('monitoring.kpi.successRate')}
          value={fPercent(data.success_rate)}
          caption={t('monitoring.caption.successRate')}
          icon="solar:shield-check-bold"
          color="info"
        />
      </Box>

      {/* Row 2: daily timeline + status mix */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <ChartCard
          title={t('monitoring.charts.daily')}
          subheader={t('monitoring.charts.dailySub')}
          sx={{ gridColumn: { md: 'span 8' } }}
        >
          <LineChart
            height={CHART_H}
            xAxis={[{ data: days, scaleType: 'point' }]}
            series={[
              {
                data: data.daily.map((d) => d.succeeded),
                label: t('monitoring.series.succeeded'),
                color: theme.palette.success.main,
                area: true,
                showMark: false,
                curve: 'natural',
              },
              {
                data: data.daily.map((d) => d.failed),
                label: t('monitoring.series.failed'),
                color: theme.palette.error.main,
                showMark: false,
                curve: 'natural',
              },
              {
                data: data.daily.map((d) => d.pending),
                label: t('monitoring.series.pending'),
                color: theme.palette.warning.main,
                showMark: false,
                curve: 'natural',
              },
            ]}
            margin={{ left: 16, right: 24, top: 24, bottom: 24 }}
            sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.12 } }}
          />
        </ChartCard>

        <ChartCard title={t('monitoring.charts.statusMix')} sx={{ gridColumn: { md: 'span 4' } }}>
          {data.status_mix.length === 0 ? (
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
                  data: data.status_mix.map((s, i) => ({
                    id: i,
                    value: s.count,
                    label: t(`monitoring.status.${s.label}`),
                    color: statusPalette[s.label] ?? theme.palette.grey[500],
                  })),
                },
              ]}
              margin={{ top: 16, bottom: 16, left: 16, right: 16 }}
            />
          )}
        </ChartCard>
      </Box>

      {/* Row 3: repository health */}
      <Card sx={{ mt: 3 }}>
        <CardHeader title={t('monitoring.charts.repoHealth')} />
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('monitoring.table.repo')}</TableCell>
                <TableCell align="right">{t('monitoring.table.total')}</TableCell>
                <TableCell align="right">{t('monitoring.table.succeeded')}</TableCell>
                <TableCell align="right">{t('monitoring.table.failed')}</TableCell>
                <TableCell align="center">{t('monitoring.table.successRate')}</TableCell>
                <TableCell>{t('monitoring.table.lastRun')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.repos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                    {t('common.empty')}
                  </TableCell>
                </TableRow>
              )}
              {data.repos.map((r) => (
                <TableRow key={r.repo} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.repo}</TableCell>
                  <TableCell align="right">{fNumber(r.total)}</TableCell>
                  <TableCell align="right">{fNumber(r.succeeded)}</TableCell>
                  <TableCell align="right">{fNumber(r.failed)}</TableCell>
                  <TableCell align="center">
                    <Label
                      variant="soft"
                      color={
                        r.success_rate >= 75
                          ? 'success'
                          : r.success_rate >= 40
                            ? 'warning'
                            : 'error'
                      }
                    >
                      {fPercent(r.success_rate, 0)}
                    </Label>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {r.last_run ? fDateTime(r.last_run) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
