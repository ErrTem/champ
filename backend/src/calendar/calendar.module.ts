import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IcsController } from './ics.controller';
import { IcsService } from './ics.service';

@Module({
  imports: [PrismaModule],
  controllers: [IcsController],
  providers: [IcsService],
})
export class CalendarModule {}

