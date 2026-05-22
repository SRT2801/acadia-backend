import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

export const buildTypeOrmOptions = (
  env: NodeJS.ProcessEnv,
): DataSourceOptions => ({
  type: 'postgres',
  host: env.DB_HOST ?? 'localhost',
  port: Number(env.DB_PORT ?? 5432),
  username: env.DB_USERNAME ?? 'postgres',
  password: env.DB_PASSWORD ?? 'postgres',
  database: env.DB_NAME ?? 'acadia_backend',
  synchronize: (env.DB_SYNCHRONIZE ?? 'false') === 'true',
  entities: [
    join(__dirname, '..', '..', 'modules', '**', 'entities', '*{.ts,.js}'),
  ],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
});
