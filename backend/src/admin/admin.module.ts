import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { BookingsAdminController } from './bookings.admin.controller';
import { BookingsAdminService } from './bookings.admin.service';
import { FightersAdminController } from './fighters.admin.controller';
import { FightersAdminService } from './fighters.admin.service';
import { ScheduleAdminController } from './schedule.admin.controller';
import { ScheduleAdminService } from './schedule.admin.service';
import { ServicesAdminController } from './services.admin.controller';
import { ServicesAdminService } from './services.admin.service';

@Module({
  controllers: [
    AdminController,
    FightersAdminController,
    ServicesAdminController,
    ScheduleAdminController,
    BookingsAdminController,
  ],
  providers: [FightersAdminService, ServicesAdminService, ScheduleAdminService, BookingsAdminService],
})
export class AdminModule {}

