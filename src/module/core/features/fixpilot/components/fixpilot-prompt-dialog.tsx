import type { Issue } from '../types';

import { useState, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { MotionDialog } from 'src/shared/ui/animate';

import { startIssue } from '../api';
import { FixpilotRecords } from './fixpilot-records';

type Props = {
  issue: Issue | null;
  onClose: () => void;
  onStarted: () => void;
  onQuotaExceeded: () => void;
};

export function FixpilotPromptDialog({ issue, onClose, onStarted, onQuotaExceeded }: Props) {
  const { t } = useTranslate('fixpilot');

  const [prompt, setPrompt] = useState('');
  const [confirmLarge, setConfirmLarge] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'prompt' | 'attachments' | 'before' | 'after'>('prompt');

  // Keyed on the id, not the object: polling hands us a new object every few
  // seconds, and re-running this would wipe what the user is typing.
  const issueId = issue?.id ?? null;
  useEffect(() => {
    setPrompt(issue?.prompt ?? '');
    setConfirmLarge(false);
    setTab('prompt');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!issue) return;
    setSubmitting(true);
    try {
      await startIssue(issue.id, prompt, confirmLarge);
      toast.success(t('feedback.queued'));
      onClose();
      onStarted();
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      const message = err instanceof Error ? err.message : '';
      if (status === 403) {
        toast.error(t('quota.exceededToast'));
        onClose();
        onQuotaExceeded();
      } else if (message.startsWith('scope_too_large')) {
        // The gate refused: this row's verdict is newer than the one on screen,
        // so refresh instead of showing the raw backend sentence.
        toast.error(t('scope.blockedToast'));
        onStarted();
      } else {
        toast.error(err instanceof Error ? err.message : t('feedback.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isDraft = issue?.status === 'draft';
  // The gate: the backend refuses a "large" issue without confirm_large, so the
  // checkbox here mirrors that rule instead of being the only thing enforcing it.
  const isGated = isDraft && issue?.scope === 'large';

  return (
    <MotionDialog
      open={!!issue}
      onClose={submitting ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{issue?.title}</DialogTitle>

      {/* Attachments exist from the moment the draft is filed, so that tab shows
          even before a run has produced any before/after evidence. */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
        <Tab value="prompt" label={t('tabs.prompt')} />
        <Tab value="attachments" label={t('attachments.title')} />
        {!isDraft && <Tab value="before" label={t('tabs.before')} />}
        {!isDraft && <Tab value="after" label={t('tabs.after')} />}
      </Tabs>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {issue?.error && <Alert severity="warning">{issue.error}</Alert>}

          {tab === 'prompt' && (
            <>
              {isDraft && !issue?.error && <Alert severity="info">{t('create.promptHint')}</Alert>}
              {isDraft && issue?.scope === 'small' && (
                <Alert severity="success">{t('scope.smallHint')}</Alert>
              )}
              {isGated && (
                <Alert severity="warning">
                  {issue?.scope_reason
                    ? t('scope.largeHint', { reason: `${issue.scope_reason}.` })
                    : t('scope.largeNoReason')}
                  <FormControlLabel
                    sx={{ display: 'flex', mt: 1 }}
                    control={
                      <Checkbox
                        checked={confirmLarge}
                        onChange={(e) => setConfirmLarge(e.target.checked)}
                      />
                    }
                    label={t('scope.confirm')}
                  />
                </Alert>
              )}
              <TextField
                label={t('create.promptLabel')}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                multiline
                minRows={8}
                maxRows={16}
                fullWidth
                slotProps={{ input: { readOnly: !isDraft } }}
              />
            </>
          )}

          {tab !== 'prompt' && issue && <FixpilotRecords issueId={issue.id} folder={tab} />}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={submitting} onClick={handleClose}>
          {isDraft ? t('create.cancel') : t('records.close')}
        </Button>
        {isDraft && (
          <Button
            variant="contained"
            loading={submitting}
            disabled={!prompt.trim() || (isGated && !confirmLarge)}
            onClick={handleSubmit}
          >
            {t('create.submit')}
          </Button>
        )}
      </DialogActions>
    </MotionDialog>
  );
}
