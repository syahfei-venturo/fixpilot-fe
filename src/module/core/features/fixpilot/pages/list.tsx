import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { FixpilotView } from '../views/fixpilot-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('fixpilot');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <FixpilotView />
    </>
  );
}
