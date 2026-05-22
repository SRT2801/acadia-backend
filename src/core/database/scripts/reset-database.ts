import dataSource from '../data-source';

async function resetDatabase() {
  await dataSource.initialize();

  console.warn(
    'Resetting database: dropping schema public CASCADE and recreating it.',
  );

  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public');
  await dataSource.query('GRANT ALL ON SCHEMA public TO CURRENT_USER');
  await dataSource.query('GRANT ALL ON SCHEMA public TO public');

  await dataSource.destroy();
  console.log('Database reset completed');
}

resetDatabase().catch((error) => {
  console.error('Database reset failed', error);
  process.exit(1);
});
