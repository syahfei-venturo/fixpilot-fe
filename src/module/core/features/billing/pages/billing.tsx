import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { BillingView } from '../views/billing-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('billing');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <BillingView />
    </>
  );
}
