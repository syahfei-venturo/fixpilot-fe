import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { CompaniesListView } from '../views/companies-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('companies');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <CompaniesListView />
    </>
  );
}
