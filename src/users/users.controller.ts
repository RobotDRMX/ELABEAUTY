import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthService, JwtAuthGuard } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateRoleDto } from '../auth/dto/auth.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.authService.updateRole(+id, updateRoleDto.role);
  }
}
