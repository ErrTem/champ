import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { BookingsService } from './bookings.service';
import { BOOKING_TOO_SOON_CODE, SLOT_UNAVAILABLE_CODE } from './bookings.constants';
import { CreateBookingDto } from './dto/create-booking.dto';

type JwtUser = { sub: string; email: string };

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  @UseGuards(JwtAccessAuthGuard)
  async getMy(@Req() req: { user: JwtUser }) {
    return await this.bookings.getMyBookings({ userId: req.user.sub });
  }

  @Get(':id')
  @UseGuards(JwtAccessAuthGuard)
  async getById(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return await this.bookings.getBookingForUser({ bookingId: id, userId: req.user.sub });
  }

  @Post()
  @UseGuards(JwtAccessAuthGuard)
  async create(@Req() req: { user: JwtUser }, @Body() dto: CreateBookingDto) {
    try {
      return await this.bookings.createBooking({ userId: req.user.sub, slotId: dto.slotId });
    } catch (e) {
      // Standardize concurrency conflicts to a stable, UI-actionable contract.
      if (e instanceof ConflictException) {
        const res = e.getResponse();
        const code = typeof res === 'object' && res !== null ? (res as { code?: unknown }).code : undefined;
        if (code === SLOT_UNAVAILABLE_CODE) {
          throw new ConflictException({
            code: SLOT_UNAVAILABLE_CODE,
            message: 'That time is no longer available. Please pick another slot.',
          });
        }
      }
      if (e instanceof BadRequestException) {
        const res = e.getResponse();
        const code = typeof res === 'object' && res !== null ? (res as { code?: unknown }).code : undefined;
        if (code === BOOKING_TOO_SOON_CODE) {
          throw new BadRequestException({
            code: BOOKING_TOO_SOON_CODE,
            message: 'Bookings must be made at least 24 hours in advance.',
          });
        }
      }
      throw e;
    }
  }
}

