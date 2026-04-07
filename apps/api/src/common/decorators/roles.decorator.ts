import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict endpoint access by role.
 * Usage: @Roles(UserRole.ADMIN, UserRole.ENGINEER)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
