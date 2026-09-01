import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';
import { Form, Field } from 'src/shared/ui/hook-form';
import { FileThumbnail } from 'src/shared/ui/file-thumbnail';

import { listRepos, createIssue } from '../api';
import {
  ACCEPT_ATTR,
  MAX_ATTACHMENTS,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  checkAttachment,
} from '../utils/attachment';

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
  // Files are buffered locally and only uploaded with the draft, so a cancelled
  // dialog leaves nothing behind on the server.
  const [files, setFiles] = useState<File[]>([]);

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
    setFiles([]);
    onClose();
  };

  const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    // Reset the input straight away so re-picking the same file still fires onChange.
    event.target.value = '';

    const accepted: File[] = [];
    picked.forEach((file) => {
      const rejection = checkAttachment(file);
      if (!rejection) {
        accepted.push(file);
      } else if (rejection.reason === 'type') {
        toast.error(t('attachments.badType', { name: file.name }));
      } else {
        toast.error(t('attachments.tooLarge', { name: file.name, limit: rejection.limitMb }));
      }
    });

    if (accepted.length === 0) return;

    // Decide outside the state updater: React invokes updaters twice in
    // StrictMode, which would fire this toast twice.
    const room = Math.max(MAX_ATTACHMENTS - files.length, 0);
    if (accepted.length > room) {
      toast.error(t('attachments.tooMany', { max: MAX_ATTACHMENTS }));
    }
    setFiles((prev) => [...prev, ...accepted.slice(0, room)]);
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  // The draft lands in the list immediately; the prompt is written there, not here.
  const handleSubmit = methods.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await createIssue(values, files);
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
            {/* Claim the dialog's initial focus. Without this it lands on the
                attach control, whose label opens the file picker on its own. */}
            <Field.Text autoFocus name="title" label={t('form.title')} />
            <Field.Text name="description" label={t('form.description')} multiline rows={4} />

            <Stack spacing={1}>
              {/* A label wrapping the input opens the picker natively. Calling
                  .click() on a hidden input instead is a no-op in some browsers,
                  which left the button doing nothing at all. */}
              <Button
                component="label"
                variant="outlined"
                color="inherit"
                disabled={files.length >= MAX_ATTACHMENTS}
                startIcon={<Iconify icon="eva:attach-2-fill" />}
                sx={{ alignSelf: 'flex-start' }}
              >
                {t('attachments.add')}
                <input type="file" hidden multiple accept={ACCEPT_ATTR} onChange={handlePick} />
              </Button>

              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('attachments.hint', {
                  image: MAX_IMAGE_BYTES / 1024 / 1024,
                  video: MAX_VIDEO_BYTES / 1024 / 1024,
                  max: MAX_ATTACHMENTS,
                })}
              </Typography>

              {files.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {files.map((file, index) => (
                    <FileThumbnail
                      key={`${file.name}-${index}`}
                      tooltip
                      showImage
                      file={file}
                      onRemove={() => removeFile(index)}
                      sx={{ width: 64, height: 64 }}
                    />
                  ))}
                </Box>
              )}
            </Stack>
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
