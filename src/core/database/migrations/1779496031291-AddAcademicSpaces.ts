import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAcademicSpaces1779496031291 implements MigrationInterface {
  name = 'AddAcademicSpaces1779496031291';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "faculties" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "universityId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_faculties_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "careers" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "facultyId" integer, "universityId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_careers_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "courses" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "code" character varying NOT NULL, "description" text, "semester" character varying, "universityId" integer NOT NULL, "facultyId" integer, "careerId" integer, "createdById" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_courses_code" UNIQUE ("code"), CONSTRAINT "PK_courses_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "academic_spaces" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "visibility" character varying NOT NULL DEFAULT 'PRIVATE', "courseId" integer NOT NULL, "ownerId" integer NOT NULL, "settings" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_academic_spaces_slug" UNIQUE ("slug"), CONSTRAINT "UQ_academic_spaces_courseId" UNIQUE ("courseId"), CONSTRAINT "PK_academic_spaces_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "channel_categories" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "position" integer NOT NULL DEFAULT '0', "academicSpaceId" integer NOT NULL, CONSTRAINT "PK_channel_categories_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "channels" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "type" character varying NOT NULL DEFAULT 'TEXT', "position" integer NOT NULL DEFAULT '0', "icon" character varying, "academicSpaceId" integer NOT NULL, "categoryId" integer, "createdById" integer NOT NULL, "isLocked" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_channels_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "course_members" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "courseId" integer NOT NULL, "role" character varying NOT NULL DEFAULT 'STUDENT', "status" character varying NOT NULL DEFAULT 'ACTIVE', "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_course_members_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "invitations" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "courseId" integer NOT NULL, "createdById" integer NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE, "maxUses" integer NOT NULL DEFAULT '0', "uses" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_invitations_code" UNIQUE ("code"), CONSTRAINT "PK_invitations_id" PRIMARY KEY ("id"))`,
    );

    // FK — faculties
    await queryRunner.query(
      `ALTER TABLE "faculties" ADD CONSTRAINT "FK_faculties_universityId" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // FK — careers
    await queryRunner.query(
      `ALTER TABLE "careers" ADD CONSTRAINT "FK_careers_facultyId" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "careers" ADD CONSTRAINT "FK_careers_universityId" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // FK — courses
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_universityId" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_facultyId" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_careerId" FOREIGN KEY ("careerId") REFERENCES "careers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_createdById" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // FK — academic_spaces
    await queryRunner.query(
      `ALTER TABLE "academic_spaces" ADD CONSTRAINT "FK_academic_spaces_courseId" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_spaces" ADD CONSTRAINT "FK_academic_spaces_ownerId" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // FK — channel_categories
    await queryRunner.query(
      `ALTER TABLE "channel_categories" ADD CONSTRAINT "FK_channel_categories_academicSpaceId" FOREIGN KEY ("academicSpaceId") REFERENCES "academic_spaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // FK — channels
    await queryRunner.query(
      `ALTER TABLE "channels" ADD CONSTRAINT "FK_channels_academicSpaceId" FOREIGN KEY ("academicSpaceId") REFERENCES "academic_spaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "channels" ADD CONSTRAINT "FK_channels_categoryId" FOREIGN KEY ("categoryId") REFERENCES "channel_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "channels" ADD CONSTRAINT "FK_channels_createdById" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // FK — course_members
    await queryRunner.query(
      `ALTER TABLE "course_members" ADD CONSTRAINT "FK_course_members_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_members" ADD CONSTRAINT "FK_course_members_courseId" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // FK — invitations
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_courseId" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_createdById" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_course_members_userId" ON "course_members" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_course_members_courseId" ON "course_members" ("courseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_channels_academicSpaceId" ON "channels" ("academicSpaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_channel_categories_academicSpaceId" ON "channel_categories" ("academicSpaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_courseId" ON "invitations" ("courseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_courses_universityId" ON "courses" ("universityId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_courses_universityId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invitations_courseId"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_channel_categories_academicSpaceId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_channels_academicSpaceId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_course_members_courseId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_course_members_userId"`);

    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_createdById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_courseId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_members" DROP CONSTRAINT "FK_course_members_courseId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_members" DROP CONSTRAINT "FK_course_members_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channels" DROP CONSTRAINT "FK_channels_createdById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channels" DROP CONSTRAINT "FK_channels_categoryId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channels" DROP CONSTRAINT "FK_channels_academicSpaceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_categories" DROP CONSTRAINT "FK_channel_categories_academicSpaceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_spaces" DROP CONSTRAINT "FK_academic_spaces_ownerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_spaces" DROP CONSTRAINT "FK_academic_spaces_courseId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_createdById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_careerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_facultyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_universityId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "careers" DROP CONSTRAINT "FK_careers_universityId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "careers" DROP CONSTRAINT "FK_careers_facultyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faculties" DROP CONSTRAINT "FK_faculties_universityId"`,
    );

    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TABLE "course_members"`);
    await queryRunner.query(`DROP TABLE "channels"`);
    await queryRunner.query(`DROP TABLE "channel_categories"`);
    await queryRunner.query(`DROP TABLE "academic_spaces"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TABLE "careers"`);
    await queryRunner.query(`DROP TABLE "faculties"`);
  }
}
