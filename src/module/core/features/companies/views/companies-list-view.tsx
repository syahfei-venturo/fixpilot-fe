import type { Company } from '../types';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { PERM } from 'src/shared/lib/permissions';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { DashboardContent } from 'src/layouts/dashboard';
import { ConfirmDialog } from 'src/shared/ui/confirm-dialog';
import { SearchNotFound } from 'src/shared/ui/search-not-found';
import { usePermission } from 'src/module/core/features/auth/hooks/use-permission';
import {
  useTable,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/shared/ui/table';

import { deleteCompany, restoreCompany } from '../api';
import { useCompanyList } from '../hooks/use-company-list';
import { CompanyTableRow } from '../components/company-table-row';
import { CompanyFormDialog } from '../components/company-form-dialog';
import { CompanyMembersDialog } from '../components/company-members-dialog';

// ----------------------------------------------------------------------

export function CompaniesListView() {
  const { t } = useTranslate('companies');
  const { t: tCommon } = useTranslate('common');
  const { can, canAny } = usePermission();
  const canCreate = can(PERM.companies.create);
  const canEdit = can(PERM.companies.update);
  const canDelete = can(PERM.companies.delete);
  const canManageMembers = canAny([
    PERM.companyUsers.read,
    PERM.companyUsers.create,
    PERM.companyUsers.update,
  ]);

  const table = useTable({ defaultRowsPerPage: 25, defaultDense: true });
  const [search, setSearch] = useState('');
  const [trashMode, setTrashMode] = useState(false);
  const [formState, setFormState] = useState<{ mode: 'new' | 'edit'; seed: Company | null } | null>(
    null
  );
  const [membersTarget, setMembersTarget] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const TABLE_HEAD = useMemo(
    () => [
      { id: 'name', label: t('table.name') },
      { id: 'type', label: t('table.type') },
      { id: 'owner', label: t('table.owner') },
      { id: 'status', label: t('table.status') },
      { id: 'actions', label: '', align: 'right' as const },
    ],
    [t]
  );

  const listParams = useMemo(
    () => ({ page: table.page + 1, limit: table.rowsPerPage, search }),
    [table.page, table.rowsPerPage, search]
  );

  const { data, meta, loading, error, refresh } = useCompanyList(listParams, trashMode);

  const parentOptions = useMemo(
    () => data.filter((c) => c.type === 'holding').map((c) => ({ id: c.id, name: c.name })),
    [data]
  );

  const handleSaved = useCallback(
    (saved: Company) => {
      refresh();
      setFormState(null);
      toast.success(t('feedback.saved', { name: saved.name }));
    },
    [refresh, t]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteCompany(deleteTarget.id);
      refresh();
      setDeleteTarget(null);
      toast.success(t('feedback.deleted'));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('errors.deleteFailed'));
    } finally {
      setActionLoading(false);
    }
  }, [deleteTarget, refresh, t]);

  const handleRestore = useCallback(
    async (row: Company) => {
      try {
        await restoreCompany(row.id);
        refresh();
        toast.success(t('feedback.restored', { name: row.name }));
      } catch (err) {
        setActionError(err instanceof Error ? err.message : t('errors.restoreFailed'));
      }
    },
    [refresh, t]
  );

  const showSkeletons = loading && data.length === 0;
  const isEmpty = !loading && data.length === 0;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title={t('title')}
        action={
          canCreate && !trashMode ? (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setFormState({ mode: 'new', seed: null })}
            >
              {t('buttons.new')}
            </Button>
          ) : null
        }
      />

      <Stack spacing={3}>
        <Card>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ p: 2.5, alignItems: { md: 'center' } }}
          >
            <TextField
              fullWidth
              value={search}
              disabled={trashMode}
              onChange={(e) => {
                setSearch(e.target.value);
                table.onResetPage();
              }}
              placeholder={t('toolbar.searchPlaceholder')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {canDelete && (
              <ToggleButtonGroup
                exclusive
                size="small"
                value={trashMode ? 'trash' : 'active'}
                onChange={(_, v) => {
                  if (v) {
                    setTrashMode(v === 'trash');
                    table.onResetPage();
                  }
                }}
              >
                <ToggleButton value="active">{t('toolbar.active')}</ToggleButton>
                <ToggleButton value="trash">{t('toolbar.trash')}</ToggleButton>
              </ToggleButtonGroup>
            )}
          </Stack>
          <Divider />

          {error && (
            <Alert severity="error" sx={{ m: 2.5 }}>
              {error}
            </Alert>
          )}

          <TableContainer>
            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
                <TableHeadCustom headCells={TABLE_HEAD} />
                <TableBody>
                  {showSkeletons && (
                    <TableSkeleton rowCount={table.rowsPerPage} cellCount={TABLE_HEAD.length} />
                  )}

                  {data.map((row) => (
                    <CompanyTableRow
                      key={row.id}
                      row={row}
                      trashMode={trashMode}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      canManageMembers={canManageMembers}
                      onEdit={(c) => setFormState({ mode: 'edit', seed: c })}
                      onDelete={setDeleteTarget}
                      onRestore={handleRestore}
                      onMembers={setMembersTarget}
                    />
                  ))}

                  {isEmpty && (
                    <TableRow>
                      <TableCell colSpan={TABLE_HEAD.length}>
                        {search ? (
                          <SearchNotFound query={search} sx={{ py: 8 }} />
                        ) : (
                          <Box sx={{ py: 8, textAlign: 'center' }}>
                            <Typography variant="h6">
                              {trashMode ? t('list.trashEmptyTitle') : t('list.emptyTitle')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                              {trashMode ? t('list.trashEmptySubtitle') : t('list.emptySubtitle')}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          {!trashMode && (
            <TablePaginationCustom
              component="div"
              page={table.page}
              count={meta.total}
              rowsPerPage={table.rowsPerPage}
              rowsPerPageOptions={[25, 50, 100]}
              onPageChange={table.onChangePage}
              onRowsPerPageChange={table.onChangeRowsPerPage}
              labelRowsPerPage={tCommon('pagination.rowsPerPage')}
            />
          )}
        </Card>
      </Stack>

      <CompanyFormDialog
        open={!!formState}
        mode={formState?.mode ?? 'new'}
        seed={formState?.seed ?? null}
        parentOptions={parentOptions}
        onClose={() => setFormState(null)}
        onSaved={handleSaved}
      />

      <CompanyMembersDialog
        open={!!membersTarget}
        company={membersTarget}
        onClose={() => setMembersTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('delete.title')}
        description={deleteTarget ? t('delete.message', { name: deleteTarget.name }) : ''}
        confirmLabel={tCommon('actions.delete')}
        confirmColor="error"
        loading={actionLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <ErrorDialog
        open={!!actionError}
        message={actionError ?? ''}
        onClose={() => setActionError(null)}
      />
    </DashboardContent>
  );
}
