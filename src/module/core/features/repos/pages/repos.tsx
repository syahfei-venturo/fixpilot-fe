import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { ReposView } from '../views/repos-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('repos');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <ReposView />
    </>
  );
}
