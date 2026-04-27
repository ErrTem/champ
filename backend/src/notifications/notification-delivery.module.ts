import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationDeliveryService } from './notification-delivery.service';

@Module({
  imports: [PrismaModule, PushModule],
  providers: [NotificationDeliveryService, NotificationPreferencesService],
  exports: [NotificationDeliveryService],
})
export class NotificationDeliveryModule {}

