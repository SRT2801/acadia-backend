import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { UniversitiesModule } from './modules/universities/universities.module';
import { CoursesModule } from './modules/courses/courses.module';
import { DatabaseModule } from './core/database/database.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 60 }],
      errorMessage: 'Too many requests, please try again later',
    }),
    DatabaseModule,
    UsersModule,
    RolesModule,
    UniversitiesModule,
    MailModule,
    AuthModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
