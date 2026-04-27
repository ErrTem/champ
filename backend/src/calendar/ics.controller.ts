import { Controller, Get, NotFoundException, Param, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { PrismaService } from '../prisma/prisma.service';
import { IcsService } from './ics.service';

type JwtUser = { sub: string; email: string };

@Controller('bookings')
export class IcsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ics: IcsService,
  ) {}

  @Get(':id/ics')
  @UseGuards(JwtAccessAuthGuard)
  async getBookingIcs(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const viewerId = req.user.sub;

    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        slot: { select: { startsAtUtc: true, endsAtUtc: true } },
        fighter: { select: { name: true, userId: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      select: { isAdmin: true },
    });

    const isOwner = booking.userId === viewerId;
    const isFighter = booking.fighter.userId ? booking.fighter.userId === viewerId : false;
    const isAdmin = Boolean(viewer?.isAdmin);
    if (!isOwner && !isFighter && !isAdmin) throw new NotFoundException('Booking not found');

    const icsText = this.ics.generateBookingIcs({
      bookingId: booking.id,
      startsAtUtc: booking.slot.startsAtUtc,
      endsAtUtc: booking.slot.endsAtUtc,
      fighterName: booking.fighter.name,
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="booking-${booking.id}.ics"`);
    return icsText;
  }
}

