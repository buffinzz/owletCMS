import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Public staff directory
  @Get('directory')
  findDirectory() {
    return this.usersService.findPublicDirectory();
  }

  // My own profile (any logged in user)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: { user: { id: number } }) {
    return this.usersService.getMe(req.user.id);
  }

  // Update my own profile
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Request() req: { user: { id: number } }, @Body() data: any) {
    return this.usersService.updateMe(req.user.id, data);
  }

  // Admin: list all users
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findAll() {
    return this.usersService.findStaff(); // only returns staff, not patrons
  }

  // Admin: create user
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: { username: string; password: string; role: UserRole }) {
    return this.usersService.create(body);
  }

  // Admin: update any user
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(+id, data);
  }

  // Admin: delete user
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Get('profile/:username')
  async getProfile(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;
    const { id, displayName, jobTitle, bio, location, photoUrl, customFields } = user;
    return { id, username: user.username, displayName, jobTitle, bio, location, photoUrl, customFields };
  }
}
