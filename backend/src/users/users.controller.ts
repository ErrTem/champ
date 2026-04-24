import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

type JwtUser = { sub: string; email: string };

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @UseGuards(JwtAccessAuthGuard)
  async me(@Req() req: { user: JwtUser }) {
    return this.users.findSafeById(req.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAccessAuthGuard)
  async patchMe(@Req() req: { user: JwtUser }, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(req.user.sub, dto);
  }
}
