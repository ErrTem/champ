import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

type JwtUser = { sub: string; email: string };

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @UseGuards(JwtAccessAuthGuard)
  async create(@Req() req: { user: JwtUser }, @Body() dto: CreateBookingDto) {
    return this.bookings.createBooking({ userId: req.user.sub, slotId: dto.slotId });
  }
}

