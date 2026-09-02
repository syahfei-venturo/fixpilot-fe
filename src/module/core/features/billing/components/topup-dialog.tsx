import { useState } from 'react';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { MotionDialog } from 'src/shared/ui/animate';

import { formatPrice } from '../views/format-price';

// ----------------------------------------------------------------------

const CREDIT_PRICE_RP = 1000;
const MIN_CREDITS = 10;
const MAX_CREDITS = 10000;

type Props = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (credits: number) => void;
};

export function TopUpDialog({ open, loading, onClose, onConfirm }: Props) {
  const { t } = useTranslate('billing');
  const [credits, setCredits] = useState(100);

  const invalid = !Number.isInteger(credits) || credits < MIN_CREDITS || credits > MAX_CREDITS;

  return (
    <MotionDialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('topup.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={1}>
            {[50, 100, 500].map((preset) => (
              <Chip
                key={preset}
                label={preset}
                variant={credits === preset ? 'filled' : 'outlined'}
                color={credits === preset ? 'primary' : 'default'}
                onClick={() => setCredits(preset)}
              />
            ))}
          </Stack>
          <TextField
            type="number"
            label={t('topup.amountLabel')}
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value))}
            error={invalid}
            helperText={invalid ? t('topup.rangeError') : undefined}
            slotProps={{ htmlInput: { min: MIN_CREDITS, max: MAX_CREDITS, step: 1 } }}
          />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('topup.priceInfo', { price: formatPrice(credits * CREDIT_PRICE_RP) })}
          </Typography>
          <Alert severity="info">{t('topup.note')}</Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={loading} onClick={onClose}>
          {t('confirm.cancel')}
        </Button>
        <Button variant="contained" disabled={loading || invalid} onClick={() => onConfirm(credits)}>
          {t('confirm.pay')}
        </Button>
      </DialogActions>
    </MotionDialog>
  );
}
