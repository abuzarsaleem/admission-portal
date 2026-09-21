export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  appName: process.env.APP_NAME ?? 'admission-portal',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  database: {
    url: process.env.DATABASE_URL ?? '',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER ?? 'admissions',
    password: process.env.DATABASE_PASSWORD ?? '',
    name: process.env.DATABASE_NAME ?? 'admissions',
    ssl: process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1',
  },
  basePlatform: {
    url:
      process.env.IAM_BASE_URL ??
      process.env.BASE_PLATFORM_URL ??
      '',
    appCode: process.env.BASE_PLATFORM_APP_CODE ?? 'ADM-F000',
  },
  iam: {
    baseUrl: process.env.IAM_BASE_URL ?? process.env.BASE_PLATFORM_URL ?? '',
    defaultTenantId: (process.env.DEFAULT_TENANT_ID ?? '').replace(
      /^["']|["']$/g,
      '',
    ),
  },
  oauth: {
    clientId:
      process.env.OAUTH_ADMIN_CLIENT_ID ??
      process.env.VITE_ADMIN_OAUTH_CLIENT_ID ??
      'admission-portal',
    clientSecret:
      process.env.OAUTH_ADMIN_CLIENT_SECRET ??
      process.env.VITE_ADMIN_OAUTH_CLIENT_SECRET ??
      '',
    redirectUri:
      process.env.OAUTH_ADMIN_REDIRECT_URI ??
      process.env.VITE_ADMIN_PORTAL_CALLBACK ??
      'http://localhost:3000/callback',
    scope: process.env.OAUTH_SCOPE ?? '',
  },
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ??
      process.env.JWT_SECRET ??
      'change-me-access-secret-min-32-chars',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  },
});
