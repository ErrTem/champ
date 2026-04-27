import { Module } from '@nestjs/common';
import { NotificationDeliveryModule } from '../notifications/notification-delivery.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [PrismaModule, NotificationsModule, PushModule, NotificationDeliveryModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}

