import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { listRecords, fetchRecordUrl } from '../api';

type Props = { issueId: string; folder: 'before' | 'after' };

const isVideo = (name: string) => /\.(webm|mp4)$/i.test(name);
const isImage = (name: string) => /\.(png|jpe?g|gif|webp)$/i.test(name);

/** Renders one side (before or after) of the test evidence a fixing job left behind. */
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

    listRecords(issueId)
      .then(async (all) => {
        // Videos first — they are the point of the tab, text output is backup.
        const names = all
          .filter((name) => name.startsWith(`${folder}/`))
          .sort((a, b) => Number(isVideo(b)) - Number(isVideo(a)));
        if (cancelled) return;
        setFiles(names);
        // allSettled, not all: one unreadable file must not blank out the rest
        // of the evidence.
        const settled = await Promise.allSettled(
          names.map(async (name) => [name, await fetchRecordUrl(issueId, name)] as const)
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
