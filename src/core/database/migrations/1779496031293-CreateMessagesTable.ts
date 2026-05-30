import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessagesTable1779496031293 implements MigrationInterface {
  name = 'CreateMessagesTable1779496031293';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" SERIAL NOT NULL,
        "content" text NOT NULL,
        "channelId" integer NOT NULL,
        "userId" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_channel" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_channelId" ON "messages" ("channelId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_userId" ON "messages" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_messages_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_messages_channelId"`);
    await queryRunner.query(`DROP TABLE "messages"`);
  }
}
