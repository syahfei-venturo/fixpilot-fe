import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { MotionDialog } from 'src/shared/ui/animate';
import { Form, Field } from 'src/shared/ui/hook-form';

import { listRepos, createIssue, generatePrompt } from '../api';

const schema = z.object({
  repo: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onQuotaExceeded: () => void;
};

export function FixpilotCreateDialog({ open, onClose, onCreated, onQuotaExceeded }: Props) {
  const { t } = useTranslate('fixpilot');

  const [step, setStep] = useState<'form' | 'review'>('form');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [repoOptions, setRepoOptions] = useState<string[]>([]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { repo: '', title: '', description: '' },
  });

  useEffect(() => {
    if (!open) return;
    listRepos()
      .then((res) => {
        setRepoOptions(res.effective);
        const current = methods.getValues('repo');
        if (!current || !res.effective.includes(current)) {
          methods.setValue('repo', res.effective[0] ?? '');
        }
      })
      .catch(() => setRepoOptions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const busy = generating || submitting;

  const resetAll = () => {
    setStep('form');
    setPrompt('');
    methods.reset({ repo: repoOptions[0] ?? '', title: '', description: '' });
  };

  const handleClose = () => {
    if (busy) return;
    resetAll();
    onClose();
  };

  const handleGenerate = methods.handleSubmit(async (values) => {
    setGenerating(true);
    try {
      const draft = await generatePrompt(values);
      setPrompt(draft);
      setStep('review');
    } catch {
      toast.error(t('create.generateError'));
    } finally {
      setGenerating(false);
    }
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createIssue({ ...methods.getValues(), prompt });
      toast.success(t('feedback.queued'));
      resetAll();
      onClose();
      onCreated();
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 403) {
        toast.error(t('quota.exceededToast'));
        resetAll();
        onQuotaExceeded();
      } else {
        toast.error(err instanceof Error ? err.message : t('feedback.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionDialog open={open} onClose={busy ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('create.title')}</DialogTitle>

      {step === 'form' ? (
        <Form methods={methods} onSubmit={handleGenerate}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {repoOptions.length === 0 && (
                <Alert severity="info">
                  {t('create.noRepos')}{' '}
                  <RouterLink href={paths.dashboard.settings.repos}>
                    {t('create.noReposLink')}
                  </RouterLink>
                </Alert>
              )}
              <Field.Select name="repo" label={t('form.repo')}>
                {repoOptions.map((repo) => (
                  <MenuItem key={repo} value={repo}>
                    {repo}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text name="title" label={t('form.title')} />
              <Field.Text name="description" label={t('form.description')} multiline rows={4} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button color="inherit" disabled={busy} onClick={handleClose}>
              {t('create.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              loading={generating}
              disabled={repoOptions.length === 0}
            >
              {t('create.generate')}
            </Button>
          </DialogActions>
        </Form>
      ) : (
        <>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="info">{t('create.promptHint')}</Alert>
              <TextField
                label={t('create.promptLabel')}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                multiline
                minRows={8}
                maxRows={16}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button color="inherit" disabled={busy} onClick={() => setStep('form')}>
              {t('create.back')}
            </Button>
            <Button
              variant="contained"
              loading={submitting}
              disabled={!prompt.trim()}
              onClick={handleSubmit}
            >
              {t('create.submit')}
            </Button>
          </DialogActions>
        </>
      )}
    </MotionDialog>
  );
}
