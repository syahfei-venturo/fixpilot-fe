import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { MotionDialog } from 'src/shared/ui/animate';
import { Form, Field } from 'src/shared/ui/hook-form';

import { createIssue, generatePrompt } from '../api';

// ----------------------------------------------------------------------

const TARGET_REPOS = ['fixpilot-target-go', 'fixpilot-target-react'];

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

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { repo: TARGET_REPOS[0], title: '', description: '' },
  });

  const busy = generating || submitting;

  const resetAll = () => {
    setStep('form');
    setPrompt('');
    methods.reset({ repo: TARGET_REPOS[0], title: '', description: '' });
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
              <Field.Select name="repo" label={t('form.repo')}>
                {TARGET_REPOS.map((repo) => (
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
            <Button type="submit" variant="contained" loading={generating}>
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
