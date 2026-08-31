import type { RepoSettings } from 'src/module/core/features/fixpilot/types';

import { useState } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { setGithubToken, deleteGithubToken } from 'src/module/core/features/fixpilot/api';

// ----------------------------------------------------------------------

type Props = {
  settings: RepoSettings;
  onChanged: () => void;
};

export function TokenCard({ settings, onChanged }: Props) {
  const { t } = useTranslate('repos');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setGithubToken(token.trim());
      setToken('');
      toast.success(t('token.saved'));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('token.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteGithubToken();
      toast.success(t('token.deleted'));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('token.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="h6">{t('token.title')}</Typography>
          <Chip
            size="small"
            color={settings.configured ? 'success' : 'default'}
            label={
              settings.configured
                ? t('token.configured', { masked: settings.token_masked })
                : t('token.notConfigured')
            }
          />
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('token.hint')}
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <TextField
            size="small"
            type="password"
            label={t('token.inputLabel')}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: 420 }}
          />
          <Button variant="contained" disabled={saving || !token.trim()} onClick={handleSave}>
            {t('token.save')}
          </Button>
          {settings.configured && (
            <Button color="error" disabled={saving} onClick={handleDelete}>
              {t('token.remove')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
