import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { listRecords, fetchRecordUrl, listAttachments, fetchAttachmentUrl } from '../api';

/**
 * `folder` picks one side of the job's own test evidence. `attachments` instead
 * shows what the reporter uploaded when they filed the issue — same rendering,
 * different source, so both go through this one component.
 */
type Props = { issueId: string; folder: 'before' | 'after' | 'attachments' };

const isVideo = (name: string) => /\.(webm|mp4|mov)$/i.test(name);
const isImage = (name: string) => /\.(png|jpe?g|gif|webp)$/i.test(name);

export function FixpilotRecords({ issueId, folder }: Props) {
  const { t } = useTranslate('fixpilot');
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    // Switching tab or issue must not show the previous folder's evidence while
    // the new fetch is still in flight.
    setFiles([]);
    setUrls({});

    let cancelled = false;
    let created: string[] = [];

    const isAttachments = folder === 'attachments';
    const list = isAttachments ? listAttachments : listRecords;
    const fetchUrl = isAttachments ? fetchAttachmentUrl : fetchRecordUrl;

    list(issueId)
      .then(async (all) => {
        // Videos first — they are the point of the tab, text output is backup.
        const names = (isAttachments ? all : all.filter((n) => n.startsWith(`${folder}/`))).sort(
          (a, b) => Number(isVideo(b)) - Number(isVideo(a))
        );
        if (cancelled) return;
        setFiles(names);
        // allSettled, not all: one unreadable file must not blank out the rest
        // of the evidence.
        const settled = await Promise.allSettled(
          names.map(async (name) => [name, await fetchUrl(issueId, name)] as const)
        );
        const pairs = settled
          .filter((r) => r.status === 'fulfilled')
          .map((r) => (r as PromiseFulfilledResult<readonly [string, string]>).value);
        created = pairs.map(([, url]) => url);
        // Cleanup already ran: these URLs were created too late for it to see.
        if (cancelled) {
          created.forEach(URL.revokeObjectURL);
          return;
        }
        setUrls(Object.fromEntries(pairs));
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
      });

    return () => {
      cancelled = true;
      created.forEach(URL.revokeObjectURL);
    };
  }, [issueId, folder]);

  if (files.length === 0) {
    return <Alert severity="info">{t('records.empty')}</Alert>;
  }

  return (
    <Stack spacing={2}>
      {files.map((name) => (
        <Stack key={name} spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            {name}
          </Typography>
          {isVideo(name) && urls[name] && (
            <Box
              component="video"
              controls
              src={urls[name]}
              sx={{ width: '100%', borderRadius: 1, bgcolor: 'common.black' }}
            />
          )}
          {isImage(name) && urls[name] && (
            <Box component="img" src={urls[name]} sx={{ width: '100%', borderRadius: 1 }} />
          )}
          {!isVideo(name) && !isImage(name) && urls[name] && (
            <Link href={urls[name]} target="_blank" rel="noopener">
              {t('records.open')}
            </Link>
          )}
        </Stack>
      ))}
    </Stack>
  );
}
