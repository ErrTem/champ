import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { AdminModule } from './admin/admin.module';
import { BookingsModule } from './bookings/bookings.module';
import { FightersModule } from './fighters/fighters.module';
import { GymsModule } from './gyms/gyms.module';
import { HealthModule } from './health/health.module';
import { FighterSelfModule } from './fighter-self/fighter-self.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PushModule } from './push/push.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    GymsModule,
    FightersModule,
    AvailabilityModule,
    BookingsModule,
    PaymentsModule,
    FighterSelfModule,
    AdminModule,
    PushModule,
    CalendarModule,
  ],
})
export class AppModule {}
