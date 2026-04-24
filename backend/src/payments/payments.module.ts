import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeClient } from './stripe.client';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PaymentsController, WebhookController],
  providers: [PaymentsService, StripeClient],
})
export class PaymentsModule {}

