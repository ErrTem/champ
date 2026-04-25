import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { AdminBookingsQueryDto } from './dto/admin-bookings.dto';
import { BookingsAdminService } from './bookings.admin.service';

@UseGuards(JwtAccessAuthGuard, AdminGuard)
@Controller('admin/bookings')
export class BookingsAdminController {
  constructor(private readonly bookings: BookingsAdminService) {}

  @Get()
  async list(@Query() query: AdminBookingsQueryDto) {
    return this.bookings.list(query);
  }

  @Get(':bookingId')
  async get(@Param('bookingId') bookingId: string) {
    return this.bookings.get(bookingId);
  }
}

