import type { IconifyName } from 'src/shared/ui/iconify';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';
import { getOverview } from 'src/module/dashboard/api';
import { fDateTime } from 'src/shared/utils/format-time';
import { fNumber, fPercent } from 'src/module/dashboard/utils/format';
import { useDashboardData } from 'src/module/dashboard/hooks/use-dashboard-data';

import { useAuthContext } from '../../auth/hooks';

// ----------------------------------------------------------------------

type ColorKey = 'primary' | 'info' | 'success' | 'warning';

const shortcuts: { key: string; href: string; icon: IconifyName; color: ColorKey }[] = [
  {
    key: 'finance',
    href: paths.dashboard.dashboards.finance,
    icon: 'solar:bill-list-bold-duotone',
    color: 'primary',
  },
  {
    key: 'monitoring',
    href: paths.dashboard.dashboards.monitoring,
    icon: 'solar:monitor-bold',
    color: 'info',
  },
  {
    key: 'sales',
    href: paths.dashboard.dashboards.sales,
    icon: 'solar:chart-square-outline',
    color: 'success',
  },
];

export function HomeView() {
  const { t } = useTranslate('home');
  const theme = useTheme();
  const { user } = useAuthContext();
  const { data, loading, error } = useDashboardData(getOverview);

  const name = user?.full_name || user?.username || '';
  const tint = (color: ColorKey) => varAlpha(theme.vars.palette[color].mainChannel, 0.12);

  const stats: { key: string; value: string; icon: IconifyName; color: ColorKey }[] = data
    ? [
        {
          key: 'plan',
          value: data.plan_name,
          icon: 'solar:case-minimalistic-bold',
          color: 'primary',
        },
        {
          key: 'fixes',
          value: fNumber(data.fixes_this_month),
          icon: 'solar:restart-bold',
          color: 'info',
        },
        {
          key: 'successRate',
          value: fPercent(data.success_rate),
          icon: 'solar:shield-check-bold',
          color: 'success',
        },
        {
          key: 'users',
          value: fNumber(data.active_users),
          icon: 'solar:users-group-rounded-bold',
          color: 'warning',
        },
        {
          key: 'credits',
          value: fNumber(data.credit_balance),
          icon: 'solar:wad-of-money-bold',
          color: 'warning',
        },
      ]
    : [];

  const activityColor: Record<string, ColorKey> = {
    pr_opened: 'success',
    merged: 'success',
    pr_closed: 'warning',
    running: 'info',
    queued: 'warning',
    failed: 'warning',
  };

  const activityIcon: Record<string, IconifyName> = {
    pr_opened: 'solar:check-circle-bold',
    merged: 'solar:check-circle-bold',
    pr_closed: 'solar:close-circle-bold',
    running: 'solar:restart-bold',
    queued: 'solar:clock-circle-bold',
    failed: 'solar:danger-triangle-bold',
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4">{name ? t('greeting', { name }) : t('greetingGuest')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('intro')}
        </Typography>
      </Stack>

      {/* Quick stats */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
        }}
      >
        {loading &&
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} variant="rounded" height={112} />)}
        {stats.map((s) => (
          <Card key={s.key} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                display: 'flex',
                borderRadius: '50%',
                alignItems: 'center',
                justifyContent: 'center',
                color: `${s.color}.main`,
                bgcolor: tint(s.color),
              }}
            >
              <Iconify icon={s.icon} width={26} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5">{s.value}</Typography>
              <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                {t(`stats.${s.key}`)}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {t('errors.load')}
        </Alert>
      )}

      {/* Shortcuts + activity */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        }}
      >
        <Box sx={{ gridColumn: { md: 'span 7' } }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('shortcuts.title')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            }}
          >
            {shortcuts.map((s) => (
              <Card key={s.key}>
                <CardActionArea component={RouterLink} href={s.href} sx={{ p: 3, height: '100%' }}>
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        display: 'flex',
                        borderRadius: 1.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: `${s.color}.main`,
                        bgcolor: tint(s.color),
                      }}
                    >
                      <Iconify icon={s.icon} width={28} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1">{t(`shortcuts.${s.key}`)}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {t(`shortcuts.${s.key}Desc`)}
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: 'center', color: `${s.color}.main` }}
                    >
                      <Typography variant="button">{t('shortcuts.open')}</Typography>
                      <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
                    </Stack>
                  </Stack>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>

        <Card sx={{ gridColumn: { md: 'span 5' } }}>
          <CardHeader title={t('activity.title')} />
          <Stack divider={<Divider flexItem />} sx={{ px: 3, py: 1 }}>
            {data?.activity.length === 0 && (
              <Typography variant="body2" sx={{ py: 2, color: 'text.secondary' }}>
                {t('activity.empty')}
              </Typography>
            )}
            {(data?.activity ?? []).map((a) => {
              const color = activityColor[a.status] ?? 'info';
              return (
                <Stack
                  key={`${a.created_at}-${a.title}`}
                  direction="row"
                  spacing={2}
                  sx={{ py: 1.5, alignItems: 'center' }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      display: 'flex',
                      borderRadius: '50%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: `${color}.main`,
                      bgcolor: tint(color),
                    }}
                  >
                    <Iconify icon={activityIcon[a.status] ?? 'solar:restart-bold'} width={20} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {a.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {a.repo} · {t(`status.${a.status}`)} · {fDateTime(a.created_at)}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
          <Box sx={{ p: 2, pt: 1 }}>
            <Label variant="soft" color="success">
              {t('activity.live')}
            </Label>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
