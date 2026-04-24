import { Controller, Get, Query } from '@nestjs/common';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  async getAvailability(@Query() query: AvailabilityQueryDto): Promise<AvailabilityResponseDto> {
    return this.availabilityService.getAvailability(query);
  }
}

