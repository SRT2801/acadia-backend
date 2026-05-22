import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddPasswordResetTokens1716404400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
          },
          {
            name: 'token',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'usedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'IDX_password_reset_tokens_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'IDX_password_reset_tokens_token',
        columnNames: ['token'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('password_reset_tokens');

    for (const index of table?.indices ?? []) {
      await queryRunner.dropIndex('password_reset_tokens', index);
    }

    await queryRunner.dropTable('password_reset_tokens');
  }
}
