import type { RepoList, RepoSettings } from 'src/module/core/features/fixpilot/types';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import { fDateTime } from 'src/shared/utils/format-time';
import { ConfirmDialog } from 'src/shared/ui/confirm-dialog';
import { listRepos, deleteRepo, getRepoSettings } from 'src/module/core/features/fixpilot/api';

import { TokenCard } from '../components/token-card';
import { AddRepoDialog } from '../components/add-repo-dialog';

// ----------------------------------------------------------------------

export function ReposView() {
  const { t } = useTranslate('repos');
  const { t: tCommon } = useTranslate('common');

  const [repos, setRepos] = useState<RepoList>({ items: [], effective: [] });
  const [settings, setSettings] = useState<RepoSettings>({ configured: false, token_masked: '' });
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; full_name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    listRepos().then(setRepos).catch(() => {});
    getRepoSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const usingFallback = repos.items.length === 0 && repos.effective.length > 0;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRepo(deleteTarget.id);
      toast.success(t('list.deleted'));
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('list.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title={t('title')}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setAddOpen(true)}
          >
            {t('list.addButton')}
          </Button>
        }
      />

      <Stack spacing={3}>
        <TokenCard settings={settings} onChanged={load} />

        {usingFallback && <Alert severity="info">{t('list.fallbackNotice')}</Alert>}

        <Card>
          <Typography variant="h6" sx={{ p: 3, pb: 1 }}>
            {t('list.title')}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('list.repo')}</TableCell>
                <TableCell>{t('list.addedAt')}</TableCell>
                <TableCell align="right" sx={{ width: 64 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {repos.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {t('list.empty')}
                  </TableCell>
                </TableRow>
              )}
              {repos.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.full_name}</TableCell>
                  <TableCell>{fDateTime(item.created_at)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="error"
                      onClick={() => setDeleteTarget({ id: item.id, full_name: item.full_name })}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Stack>

      <AddRepoDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={load} />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('list.deleteTitle')}
        description={deleteTarget ? t('list.deleteConfirm', { name: deleteTarget.full_name }) : ''}
        confirmLabel={tCommon('actions.delete')}
        confirmColor="error"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </DashboardContent>
  );
}
