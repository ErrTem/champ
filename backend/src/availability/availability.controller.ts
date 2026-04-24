import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  async getAvailability(@Query() query: AvailabilityQueryDto): Promise<AvailabilityResponseDto> {
    try {
      return await this.availabilityService.getAvailability(query);
    } catch (e) {
      // Map invalid fighter/service selection to a stable, UI-actionable shape.
      if (e instanceof NotFoundException) {
        throw new NotFoundException({ code: 'INVALID_SELECTION', message: 'Invalid selection.' });
      }
      throw e;
    }
  }
}

