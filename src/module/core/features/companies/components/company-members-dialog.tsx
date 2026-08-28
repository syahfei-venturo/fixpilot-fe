import type { Company, CompanyUser } from '../types';
import type { Role } from 'src/module/core/features/roles/types';
import type { User } from 'src/module/core/features/users/types';

import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';
import { listUsers } from 'src/module/core/features/users/api';
import { listRoles } from 'src/module/core/features/roles/api';

import { addCompanyUser, listCompanyUsers, removeCompanyUser, updateCompanyUser } from '../api';

// ----------------------------------------------------------------------

type Props = { open: boolean; company: Company | null; onClose: () => void };

export function CompanyMembersDialog({ open, company, onClose }: Props) {
  const { t } = useTranslate('companies');

  const [members, setMembers] = useState<CompanyUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    setError(null);
    try {
      setMembers(await listCompanyUsers(company.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadMembers'));
    } finally {
      setLoading(false);
    }
  }, [company, t]);

  useEffect(() => {
    if (!open || !company) return;
    loadMembers();
    listUsers({ limit: 100 })
      .then((r) => setUsers(r.data))
      .catch(() => setUsers([]));
    listRoles({ limit: 100 })
      .then((r) => setRoles(r.data))
      .catch(() => setRoles([]));
  }, [open, company, loadMembers]);

  useEffect(() => {
    if (!open) {
      setSelectedUser(null);
      setSelectedRoleId('');
      setError(null);
    }
  }, [open]);

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const candidates = users.filter((u) => !memberUserIds.has(u.id));

  const handleAdd = async () => {
    if (!company || !selectedUser) return;
    setSaving(true);
    setError(null);
    try {
      await addCompanyUser(company.id, {
        user_id: selectedUser.id,
        role_id: selectedRoleId || null,
      });
      setSelectedUser(null);
      setSelectedRoleId('');
      await loadMembers();
      toast.success(t('members.added'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.addMember'));
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (member: CompanyUser, roleId: string) => {
    if (!company) return;
    setError(null);
    try {
      await updateCompanyUser(company.id, member.user_id, { role_id: roleId || null });
      await loadMembers();
      toast.success(t('members.updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.updateMember'));
    }
  };

  const handleRemove = async (member: CompanyUser) => {
    if (!company) return;
    setError(null);
    try {
      await removeCompanyUser(company.id, member.user_id);
      await loadMembers();
      toast.success(t('members.removed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.removeMember'));
    }
  };

  return (
    <MotionDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {t('members.title', { name: company?.name ?? '' })}
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: 'center' }}>
          <Autocomplete
            fullWidth
            size="small"
            options={candidates}
            value={selectedUser}
            onChange={(_, v) => setSelectedUser(v)}
            getOptionLabel={(u) => u.full_name || u.email}
            renderInput={(params) => <TextField {...params} label={t('members.pickUser')} />}
          />
          <Select
            size="small"
            displayEmpty
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">{t('members.noRole')}</MenuItem>
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </Select>
          <Button variant="contained" disabled={!selectedUser || saving} onClick={handleAdd}>
            {t('members.add')}
          </Button>
        </Stack>

        {loading ? (
          <Stack sx={{ py: 4, alignItems: 'center' }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('members.user')}</TableCell>
                <TableCell>{t('members.role')}</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>{m.user_full_name ?? m.user_email ?? m.user_id}</TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      displayEmpty
                      value={m.role_id ?? ''}
                      onChange={(e) => handleRoleChange(m, e.target.value)}
                    >
                      <MenuItem value="">{t('members.noRole')}</MenuItem>
                      {roles.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => handleRemove(m)}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography
                      variant="body2"
                      sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}
                    >
                      {t('members.empty')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </MotionDialog>
  );
}
