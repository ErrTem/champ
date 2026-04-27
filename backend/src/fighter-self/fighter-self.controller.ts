import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { FighterApprovedGuard } from '../auth/guards/fighter-approved.guard';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { CancelFighterBookingDto } from './dto/fighter-self-bookings.dto';
import { CreateFighterSelfServiceDto, UpdateFighterSelfServiceDto } from './dto/fighter-self-service.dto';
import { ReplaceFighterSelfScheduleRulesDto } from './dto/fighter-self-schedule.dto';
import { FighterSelfService } from './fighter-self.service';

type ReqWithUser = { user?: { sub: string; email: string } };

@UseGuards(JwtAccessAuthGuard, FighterApprovedGuard)
@Controller('fighter-self')
export class FighterSelfController {
  constructor(private readonly fighterSelf: FighterSelfService) {}

  @Get('schedule-rules')
  async listScheduleRules(@Req() req: ReqWithUser) {
    return this.fighterSelf.listScheduleRules(req.user!.sub);
  }

  @Put('schedule-rules')
  async replaceScheduleRules(@Req() req: ReqWithUser, @Body() body: ReplaceFighterSelfScheduleRulesDto) {
    return this.fighterSelf.replaceScheduleRules(req.user!.sub, body.rules ?? []);
  }

  @Get('services')
  async listServices(@Req() req: ReqWithUser) {
    return this.fighterSelf.listServices(req.user!.sub);
  }

  @Post('services')
  async createService(@Req() req: ReqWithUser, @Body() body: CreateFighterSelfServiceDto) {
    return this.fighterSelf.createService(req.user!.sub, body);
  }

  @Patch('services/:serviceId')
  async updateService(
    @Req() req: ReqWithUser,
    @Param('serviceId') serviceId: string,
    @Body() body: UpdateFighterSelfServiceDto,
  ) {
    return this.fighterSelf.updateService(req.user!.sub, serviceId, body);
  }

  @Get('bookings')
  async listBookings(@Req() req: ReqWithUser) {
    return this.fighterSelf.listBookings(req.user!.sub);
  }

  @Post('bookings/:bookingId/cancel')
  async cancelBooking(
    @Req() req: ReqWithUser,
    @Param('bookingId') bookingId: string,
    @Body() body: CancelFighterBookingDto,
  ) {
    return this.fighterSelf.cancelBooking({ userId: req.user!.sub, bookingId, note: body.note });
  }
}

