import { useState } from 'react';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { MotionDialog } from 'src/shared/ui/animate';
import { addRepo } from 'src/module/core/features/fixpilot/api';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export function AddRepoDialog({ open, onClose, onAdded }: Props) {
  const { t } = useTranslate('repos');
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    if (saving) return;
    setFullName('');
    onClose();
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      await addRepo(fullName.trim());
      toast.success(t('list.added'));
      setFullName('');
      onClose();
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('list.addError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MotionDialog open={open} onClose={saving ? undefined : handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('list.addTitle')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label={t('list.fullNameLabel')}
          placeholder="owner/repo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          helperText={t('list.fullNameHint')}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={saving} onClick={handleClose}>
          {t('list.cancel')}
        </Button>
        <Button variant="contained" disabled={saving || !fullName.trim()} onClick={handleAdd}>
          {t('list.add')}
        </Button>
      </DialogActions>
    </MotionDialog>
  );
}
