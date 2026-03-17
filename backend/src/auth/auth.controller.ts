import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
  private authService: AuthService,
  private usersService: UsersService,
  ) {}
  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }
  // Add this temporary endpoint:
  @Post('setup')
  async setup(@Body() body: { username: string; password: string }) {
    return this.usersService.create(body.username, body.password, UserRole.ADMIN);
  }
}
