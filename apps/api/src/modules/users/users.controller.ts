import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './user.entity';
import { CurrentCompany } from '../../common/decorators/current-company.decorator';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @CurrentCompany() companyId: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(companyId, createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@CurrentCompany() companyId: string) {
    return this.usersService.findAll(companyId);
  }

  @Get('me')
  findMe(@CurrentUser() user: RequestUser) {
    return this.usersService.findOne(user.id, user.company_id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @CurrentCompany() companyId: string,
  ) {
    if (user.role !== UserRole.ADMIN && user.id !== id) {
      throw new ForbiddenException('Not authorized to access this user');
    }
    return this.usersService.findOne(id, companyId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: RequestUser,
    @CurrentCompany() companyId: string,
  ) {
    if (user.role !== UserRole.ADMIN && user.id !== id) {
      throw new ForbiddenException('Not authorized to update this user');
    }
    return this.usersService.update(id, companyId, updateUserDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentCompany() companyId: string) {
    return this.usersService.remove(id, companyId);
  }
}
