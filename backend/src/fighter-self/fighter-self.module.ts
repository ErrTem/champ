import { Module } from '@nestjs/common';
import { ScheduleAdminService } from '../admin/schedule.admin.service';
import { FighterApprovedGuard } from '../auth/guards/fighter-approved.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { FighterSelfController } from './fighter-self.controller';
import { FighterSelfService } from './fighter-self.service';

@Module({
  imports: [NotificationsModule],
  controllers: [FighterSelfController],
  providers: [FighterSelfService, FighterApprovedGuard, ScheduleAdminService],
})
export class FighterSelfModule {}

