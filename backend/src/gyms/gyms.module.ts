import { Module } from '@nestjs/common';
import { GymsService } from './gyms.service';

@Module({
  providers: [GymsService],
  exports: [GymsService],
})
export class GymsModule {}

