import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1779496031300 implements MigrationInterface {
  name = 'InitialSchema1779496031300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums ──────────────────────────────────────────────
    await queryRunner.query(`CREATE TYPE "user_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED')`);
    await queryRunner.query(`CREATE TYPE "course_member_role_enum" AS ENUM ('OWNER', 'PROFESSOR', 'ASSISTANT', 'STUDENT', 'MODERATOR')`);
    await queryRunner.query(`CREATE TYPE "invitation_status_enum" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED')`);
    await queryRunner.query(`CREATE TYPE "channel_type_enum" AS ENUM ('TEXT', 'ANNOUNCEMENT', 'TASKS', 'VOICE', 'FORUM', 'RESOURCES')`);
    await queryRunner.query(`CREATE TYPE "visibility_enum" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED')`);
    await queryRunner.query(`CREATE TYPE "announcement_priority_enum" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT')`);

    // ── Users ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "avatar" character varying,
        "bio" text,
        "status" "user_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "emailVerifiedAt" TIMESTAMP WITH TIME ZONE,
        "verificationToken" character varying,
        "verificationTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
        "roleId" integer NOT NULL,
        "universityId" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // ── Roles ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // ── Permissions ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_permissions_name" UNIQUE ("name"),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    // ── Role Permissions ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "roleId" integer NOT NULL,
        "permissionId" integer NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("roleId", "permissionId")
      )
    `);

    // ── Universities ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "universities" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "domain" character varying NOT NULL,
        "logo" character varying,
        "city" character varying,
        "country" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_universities_domain" UNIQUE ("domain"),
        CONSTRAINT "PK_universities" PRIMARY KEY ("id")
      )
    `);

    // ── Courses ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "courses" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "code" character varying,
        "description" text,
        "semester" character varying,
        "universityId" integer NOT NULL,
        "facultyId" integer,
        "careerId" integer,
        "createdById" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_courses_code" UNIQUE ("code"),
        CONSTRAINT "PK_courses" PRIMARY KEY ("id")
      )
    `);

    // ── Course Members ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "course_members" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "courseId" integer NOT NULL,
        "role" "course_member_role_enum" NOT NULL DEFAULT 'STUDENT',
        "status" "invitation_status_enum" NOT NULL DEFAULT 'PENDING',
        "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_course_members_user_course" UNIQUE ("userId", "courseId"),
        CONSTRAINT "PK_course_members" PRIMARY KEY ("id")
      )
    `);

    // ── Invitations ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" SERIAL NOT NULL,
        "code" character varying NOT NULL,
        "courseId" integer NOT NULL,
        "maxUses" integer NOT NULL DEFAULT 0,
        "uses" integer NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invitations_code" UNIQUE ("code"),
        CONSTRAINT "PK_invitations" PRIMARY KEY ("id")
      )
    `);

    // ── Academic Spaces ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "academic_spaces" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" text,
        "visibility" "visibility_enum" NOT NULL DEFAULT 'PRIVATE',
        "courseId" integer NOT NULL UNIQUE,
        "ownerId" integer NOT NULL,
        "settings" jsonb DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_academic_spaces_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_academic_spaces" PRIMARY KEY ("id")
      )
    `);

    // ── Channel Categories ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "channel_categories" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "academicSpaceId" integer NOT NULL,
        CONSTRAINT "PK_channel_categories" PRIMARY KEY ("id")
      )
    `);

    // ── Channels ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "channels" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "type" "channel_type_enum" NOT NULL DEFAULT 'TEXT',
        "position" integer NOT NULL DEFAULT 0,
        "icon" character varying,
        "academicSpaceId" integer NOT NULL,
        "categoryId" integer,
        "createdById" integer NOT NULL,
        "isLocked" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_channels" PRIMARY KEY ("id")
      )
    `);

    // ── Messages ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" SERIAL NOT NULL,
        "content" text NOT NULL,
        "channelId" integer NOT NULL,
        "userId" integer NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )
    `);

    // ── Announcements ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "announcements" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "pinned" boolean NOT NULL DEFAULT false,
        "priority" "announcement_priority_enum" NOT NULL DEFAULT 'NORMAL',
        "channelId" integer NOT NULL,
        "userId" integer NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcements" PRIMARY KEY ("id")
      )
    `);

    // ── Refresh Tokens ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" SERIAL NOT NULL,
        "token" character varying NOT NULL,
        "userId" integer NOT NULL,
        "sessionId" integer NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revokedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id")
      )
    `);

    // ── Password Reset Tokens ───────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "token" character varying NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "usedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id")
      )
    `);

    // ── Sessions ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "ipAddress" character varying,
        "userAgent" character varying,
        "lastActiveAt" TIMESTAMP NOT NULL DEFAULT now(),
        "expiredAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id")
      )
    `);

    // ── Foreign Keys ────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id")`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_university" FOREIGN KEY ("universityId") REFERENCES "universities"("id")`);
    await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_rp_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_rp_permission" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_university" FOREIGN KEY ("universityId") REFERENCES "universities"("id")`);
    await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id")`);
    await queryRunner.query(`ALTER TABLE "course_members" ADD CONSTRAINT "FK_cm_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "course_members" ADD CONSTRAINT "FK_cm_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "academic_spaces" ADD CONSTRAINT "FK_as_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "academic_spaces" ADD CONSTRAINT "FK_as_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id")`);
    await queryRunner.query(`ALTER TABLE "channel_categories" ADD CONSTRAINT "FK_cc_space" FOREIGN KEY ("academicSpaceId") REFERENCES "academic_spaces"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_channels_space" FOREIGN KEY ("academicSpaceId") REFERENCES "academic_spaces"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_channels_category" FOREIGN KEY ("categoryId") REFERENCES "channel_categories"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_channels_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id")`);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_channel" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "announcements" ADD CONSTRAINT "FK_announcements_channel" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "announcements" ADD CONSTRAINT "FK_announcements_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_rt_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_rt_session" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_user"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_rt_session"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_rt_user"`);
    await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT "FK_announcements_user"`);
    await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT "FK_announcements_channel"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_user"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_channel"`);
    await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_channels_createdBy"`);
    await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_channels_category"`);
    await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_channels_space"`);
    await queryRunner.query(`ALTER TABLE "channel_categories" DROP CONSTRAINT "FK_cc_space"`);
    await queryRunner.query(`ALTER TABLE "academic_spaces" DROP CONSTRAINT "FK_as_owner"`);
    await queryRunner.query(`ALTER TABLE "academic_spaces" DROP CONSTRAINT "FK_as_course"`);
    await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_course"`);
    await queryRunner.query(`ALTER TABLE "course_members" DROP CONSTRAINT "FK_cm_course"`);
    await queryRunner.query(`ALTER TABLE "course_members" DROP CONSTRAINT "FK_cm_user"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_createdBy"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_university"`);
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_rp_permission"`);
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_rp_role"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_university"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_role"`);

    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "announcements"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "channels"`);
    await queryRunner.query(`DROP TABLE "channel_categories"`);
    await queryRunner.query(`DROP TABLE "academic_spaces"`);
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TABLE "course_members"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TABLE "universities"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "announcement_priority_enum"`);
    await queryRunner.query(`DROP TYPE "visibility_enum"`);
    await queryRunner.query(`DROP TYPE "channel_type_enum"`);
    await queryRunner.query(`DROP TYPE "invitation_status_enum"`);
    await queryRunner.query(`DROP TYPE "course_member_role_enum"`);
    await queryRunner.query(`DROP TYPE "user_status_enum"`);
  }
}
