import type { BillingStatus } from 'src/module/core/features/billing/types';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

type Props = {
  billing: BillingStatus;
};

export function QuotaCard({ billing }: Props) {
  const { t } = useTranslate('fixpilot');
  const exhausted = billing.remaining === 0;
  const pct = billing.quota > 0 ? Math.min(100, (billing.used / billing.quota) * 100) : 0;

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Stack spacing={1} sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="subtitle2">{t('quotaCard.title')}</Typography>
            <Chip size="small" color={exhausted ? 'error' : 'primary'} label={billing.plan_name} />
            <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
              {t('quotaCard.usage', { used: billing.used, quota: billing.quota })}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={pct}
            color={exhausted ? 'error' : 'primary'}
            sx={{ height: 8, borderRadius: 1 }}
          />
          {exhausted && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              {t('quota.exhausted', { quota: billing.quota })}
            </Typography>
          )}
        </Stack>
        {exhausted && (
          <Button
            component={RouterLink}
            href={paths.dashboard.settings.billing}
            variant="contained"
            color="error"
            size="small"
          >
            {t('quota.upgrade')}
          </Button>
        )}
      </Stack>
    </Card>
  );
}
