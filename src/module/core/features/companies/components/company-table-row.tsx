import type { Company } from '../types';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: Company;
  trashMode: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  onEdit: (row: Company) => void;
  onDelete: (row: Company) => void;
  onRestore: (row: Company) => void;
  onMembers: (row: Company) => void;
};

export function CompanyTableRow({
  row,
  trashMode,
  canEdit,
  canDelete,
  canManageMembers,
  onEdit,
  onDelete,
  onRestore,
  onMembers,
}: Props) {
  const { t } = useTranslate('companies');

  return (
    <TableRow hover>
      <TableCell>{row.name}</TableCell>
      <TableCell>{t(`types.${row.type}`)}</TableCell>
      <TableCell>{row.owner_name ?? '—'}</TableCell>
      <TableCell>
        <Label color={row.is_active ? 'success' : 'default'}>
          {row.is_active ? t('table.active') : t('table.inactive')}
        </Label>
      </TableCell>
      <TableCell align="right">
        {trashMode ? (
          <IconButton onClick={() => onRestore(row)} title={t('buttons.restore')}>
            <Iconify icon="solar:restart-bold" />
          </IconButton>
        ) : (
          <>
            {canManageMembers && (
              <IconButton onClick={() => onMembers(row)} title={t('buttons.members')}>
                <Iconify icon="solar:users-group-rounded-bold" />
              </IconButton>
            )}
            {canEdit && (
              <IconButton onClick={() => onEdit(row)} title={t('buttons.edit')}>
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            )}
            {canDelete && (
              <IconButton color="error" onClick={() => onDelete(row)} title={t('buttons.delete')}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            )}
          </>
        )}
      </TableCell>
    </TableRow>
  );
}
