const ROOTS = {
  AUTH: '/auth',
};

export const paths = {
  faqs: '/faqs',
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
  },
  dashboard: {
    root: '/',
    fixpilot: '/fixpilot',
    dashboards: {
      finance: '/dashboards/finance',
      monitoring: '/dashboards/monitoring',
      sales: '/dashboards/sales',
    },
    settings: {
      branches: '/settings/branches',
      roles: '/settings/roles',
      users: '/settings/users',
      companies: '/settings/companies',
      translationOverride: '/settings/translation-override',
    },
    demo: {
      item: '/demo/item',
      itemEmpty: '/demo/item-empty',
      order: '/demo/order',
      orderDetail: (id: string) => `/demo/order/${id}`,
    },
  },
};
