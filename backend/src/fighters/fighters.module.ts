import { Module } from '@nestjs/common';
import { FightersController } from './fighters.controller';
import { FightersService } from './fighters.service';

@Module({
  controllers: [FightersController],
  providers: [FightersService],
})
export class FightersModule {}

