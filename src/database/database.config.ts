import type { DataSourceOptions } from 'typeorm';

type PostgresOptions = Extract<DataSourceOptions, { type: 'postgres' }>;

/**
 * Builds TypeORM Postgres options for local or Nhost (cloud) databases.
 * Prefer DATABASE_URL when set (Nhost dashboard connection string).
 */
export function buildDatabaseOptions(): PostgresOptions {
  const url = process.env.DATABASE_URL?.trim();
  const sslEnabled =
    process.env.DATABASE_SSL === 'true' ||
    process.env.DATABASE_SSL === '1' ||
    Boolean(url && !url.includes('localhost') && !url.includes('127.0.0.1'));

  const ssl = sslEnabled
    ? {
        rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
      }
    : undefined;

  if (url) {
    return {
      type: 'postgres',
      url,
      ssl,
      extra: ssl ? { ssl } : undefined,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER ?? 'admissions',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'admissions',
    ssl,
    extra: ssl ? { ssl } : undefined,
  };
}
