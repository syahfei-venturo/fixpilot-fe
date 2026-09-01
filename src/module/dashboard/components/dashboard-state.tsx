import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type Props = {
  loading: boolean;
  error: string | null;
};

/** Placeholder shown while a dashboard payload loads or fails to load. */
export function DashboardState({ loading, error }: Props) {
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!loading) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
      }}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={168} />
      ))}
      <Skeleton variant="rounded" height={360} sx={{ gridColumn: '1 / -1' }} />
    </Box>
  );
}

// ----------------------------------------------------------------------

/** Filler for a chart slot that has no rows yet, keeping the card height stable. */
export function ChartEmpty({ text, height = 340 }: { text: string; height?: number }) {
  return (
    <Box sx={{ height, display: 'grid', placeItems: 'center' }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {text}
      </Typography>
    </Box>
  );
}
