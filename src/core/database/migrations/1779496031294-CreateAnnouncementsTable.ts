import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnnouncementsTable1779496031294 implements MigrationInterface {
  name = 'CreateAnnouncementsTable1779496031294';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "announcements_priority_enum" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT')
    `);
    await queryRunner.query(`
      CREATE TABLE "announcements" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "pinned" boolean NOT NULL DEFAULT false,
        "priority" "announcements_priority_enum" NOT NULL DEFAULT 'NORMAL',
        "channelId" integer NOT NULL,
        "userId" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_announcements_channel" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_announcements_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_announcements_channelId" ON "announcements" ("channelId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_announcements_userId" ON "announcements" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_announcements_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_announcements_channelId"`);
    await queryRunner.query(`DROP TABLE "announcements"`);
    await queryRunner.query(`DROP TYPE "announcements_priority_enum"`);
  }
}
