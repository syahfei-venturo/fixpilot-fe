import type { Plan } from '../types';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { MotionDialog } from 'src/shared/ui/animate';

import { formatPrice } from '../views/format-price';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  plan: Plan | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function SubscribeConfirmDialog({ open, plan, loading, onClose, onConfirm }: Props) {
  const { t } = useTranslate('billing');

  return (
    <MotionDialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('confirm.title', { name: plan?.name ?? '' })}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="body2">
            {t('confirm.summary', {
              name: plan?.name ?? '',
              price: formatPrice(plan?.price ?? 0),
              quota: plan?.monthly_quota ?? 0,
            })}
          </Typography>
          <Alert severity="info">{t('confirm.downgradeNote')}</Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={loading} onClick={onClose}>
          {t('confirm.cancel')}
        </Button>
        <Button variant="contained" disabled={loading} onClick={onConfirm}>
          {t('confirm.pay')}
        </Button>
      </DialogActions>
    </MotionDialog>
  );
}
