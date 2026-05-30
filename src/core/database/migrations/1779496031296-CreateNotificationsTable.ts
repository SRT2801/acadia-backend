import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1779496031296 implements MigrationInterface {
  name = 'CreateNotificationsTable1779496031296';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" SERIAL NOT NULL,
        "type" varchar(30) NOT NULL,
        "title" varchar(255) NOT NULL,
        "body" text NOT NULL,
        "link" varchar(500),
        "userId" integer NOT NULL,
        "senderId" integer,
        "channelId" integer,
        "courseId" integer,
        "isRead" boolean NOT NULL DEFAULT false,
        "readAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_userId_isRead" ON "notifications" ("userId", "isRead")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_channelId" ON "notifications" ("channelId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notifications_channelId"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_userId_isRead"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_userId"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}