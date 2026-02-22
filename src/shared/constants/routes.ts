export const ROUTES = {
  HOME: '/',
  DAOS: '/daos',
  DAO_DETAIL: (id: string) => `/daos/${id}` as const,
  LOGIN: '/login',
  SIGNUP: '/signup',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  MY_DAOS: '/my-dao',
  MY_DAO_DETAIL: (id: string) => `/my-dao/${id}` as const,
  MY_DAO_CREATE: '/my-dao/create',
} as const;
