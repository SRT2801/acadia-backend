import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationToUsers1716408000000
  implements MigrationInterface
{
  name = 'AddEmailVerificationToUsers1716408000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "verificationToken" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "verificationToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "emailVerifiedAt"`,
    );
  }
}
