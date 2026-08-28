import type { IssueStatus } from '../types';
import type { BillingStatus } from 'src/module/core/features/billing/types';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import { getBillingStatus } from 'src/module/core/features/billing/api';
import { useAuthContext } from 'src/module/core/features/auth/hooks/use-auth-context';

import { useIssues } from '../hooks/use-issues';
import { QuotaCard } from '../components/quota-card';
import { FixpilotCreateDialog } from '../components/fixpilot-create-dialog';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<IssueStatus, 'default' | 'info' | 'success' | 'error'> = {
  queued: 'default',
  running: 'info',
  pr_opened: 'success',
  failed: 'error',
};

export function FixpilotView() {
  const { t } = useTranslate('fixpilot');
  const { issues, refresh } = useIssues();
  const { companyVersion } = useAuthContext();

  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadBilling = useCallback(() => {
    getBillingStatus()
      .then(setBilling)
      .catch(() => setBilling(null));
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling, companyVersion]);

  const quotaExhausted = !!billing && billing.remaining === 0;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title={t('title')}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            disabled={quotaExhausted}
            onClick={() => setDialogOpen(true)}
          >
            {t('create.button')}
          </Button>
        }
      />

      <Stack spacing={3}>
        {billing && <QuotaCard billing={billing} />}

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

      <FixpilotCreateDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={() => {
          refresh();
          loadBilling();
        }}
        onQuotaExceeded={() => {
          loadBilling();
          setDialogOpen(false);
        }}
      />
    </DashboardContent>
  );
}
