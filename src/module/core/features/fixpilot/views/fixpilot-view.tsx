import type { IssueStatus } from '../types';
import type { BillingStatus } from 'src/module/core/features/billing/types';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { toast } from 'src/shared/ui/snackbar';
import { Form, Field } from 'src/shared/ui/hook-form';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import { getBillingStatus } from 'src/module/core/features/billing/api';
import { useAuthContext } from 'src/module/core/features/auth/hooks/use-auth-context';

import { createIssue } from '../api';
import { useIssues } from '../hooks/use-issues';

// ----------------------------------------------------------------------

const TARGET_REPOS = ['fixpilot-target-go', 'fixpilot-target-react'];

const STATUS_COLOR: Record<IssueStatus, 'default' | 'info' | 'success' | 'error'> = {
  queued: 'default',
  running: 'info',
  pr_opened: 'success',
  failed: 'error',
};

const schema = z.object({
  repo: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function FixpilotView() {
  const { t } = useTranslate('fixpilot');
  const { issues, refresh } = useIssues();
  const { companyVersion } = useAuthContext();

  const [billing, setBilling] = useState<BillingStatus | null>(null);

  const loadBilling = useCallback(() => {
    getBillingStatus()
      .then(setBilling)
      .catch(() => setBilling(null));
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling, companyVersion]);

  const quotaExhausted = !!billing && billing.remaining === 0;

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { repo: TARGET_REPOS[0], title: '', description: '' },
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      await createIssue(values);
      toast.success(t('feedback.queued'));
      methods.reset({ ...values, title: '', description: '' });
      refresh();
      loadBilling();
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 403) {
        toast.error(t('quota.exceededToast'));
        loadBilling();
      } else {
        toast.error(err instanceof Error ? err.message : t('feedback.error'));
      }
    }
  });

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title={t('title')} />

      <Stack spacing={3}>
        {billing && (
          <Alert
            severity={quotaExhausted ? 'error' : 'info'}
            action={
              quotaExhausted ? (
                <Button
                  component={RouterLink}
                  href={paths.dashboard.settings.billing}
                  color="inherit"
                  size="small"
                >
                  {t('quota.upgrade')}
                </Button>
              ) : undefined
            }
          >
            {quotaExhausted
              ? t('quota.exhausted', { quota: billing.quota })
              : t('quota.usage', { used: billing.used, quota: billing.quota })}
          </Alert>
        )}

        <Card sx={{ p: 3 }}>
          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={2}>
              <Field.Select name="repo" label={t('form.repo')}>
                {TARGET_REPOS.map((repo) => (
                  <MenuItem key={repo} value={repo}>
                    {repo}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text name="title" label={t('form.title')} />
              <Field.Text name="description" label={t('form.description')} multiline rows={4} />
              <Button
                type="submit"
                variant="contained"
                sx={{ alignSelf: 'flex-start' }}
                disabled={methods.formState.isSubmitting || quotaExhausted}
              >
                {t('form.submit')}
              </Button>
            </Stack>
          </Form>
        </Card>

        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('table.title')}</TableCell>
                <TableCell>{t('table.repo')}</TableCell>
                <TableCell>{t('table.status')}</TableCell>
                <TableCell>{t('table.pr')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {issues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {t('table.empty')}
                  </TableCell>
                </TableRow>
              )}
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>{issue.title}</TableCell>
                  <TableCell>{issue.repo}</TableCell>
                  <TableCell>
                    <Label color={STATUS_COLOR[issue.status]}>{t(`status.${issue.status}`)}</Label>
                    {issue.status === 'failed' && issue.error ? ` — ${issue.error.slice(0, 120)}` : ''}
                  </TableCell>
                  <TableCell>
                    {issue.pr_url ? (
                      <Link href={issue.pr_url} target="_blank" rel="noopener">
                        {issue.pr_url.replace('https://github.com/', '')}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Stack>
    </DashboardContent>
  );
}
