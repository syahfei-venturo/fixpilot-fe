import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { MotionDialog } from 'src/shared/ui/animate';
import { Form, Field } from 'src/shared/ui/hook-form';

import { listRepos, createIssue } from '../api';

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
};

export function FixpilotCreateDialog({ open, onClose, onCreated }: Props) {
  const { t } = useTranslate('fixpilot');

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

  const handleClose = () => {
    if (submitting) return;
    methods.reset({ repo: repoOptions[0] ?? '', title: '', description: '' });
    onClose();
  };

  // The draft lands in the list immediately; the prompt is written there, not here.
  const handleSubmit = methods.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await createIssue(values);
      toast.success(t('feedback.drafted'));
      handleClose();
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('feedback.error'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <MotionDialog
      open={open}
      onClose={submitting ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('create.title')}</DialogTitle>

      <Form methods={methods} onSubmit={handleSubmit}>
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
          <Button color="inherit" disabled={submitting} onClick={handleClose}>
            {t('create.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            loading={submitting}
            disabled={repoOptions.length === 0}
          >
            {t('create.create')}
          </Button>
        </DialogActions>
      </Form>
    </MotionDialog>
  );
}
