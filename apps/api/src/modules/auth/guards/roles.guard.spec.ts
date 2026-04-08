import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockHttp: { getRequest: jest.Mock };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
    mockHttp = { getRequest: jest.fn().mockReturnValue({ user: null }) };

    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue(mockHttp),
    } as unknown as jest.Mocked<ExecutionContext>;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return true when empty roles array', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow(
        'User not authenticated',
      );
    });

    it('should return true when user is admin regardless of required roles', () => {
      const mockUser = { id: '1', role: UserRole.ADMIN };
      mockHttp.getRequest.mockReturnValue({ user: mockUser });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ENGINEER]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user lacks required role', () => {
      const mockUser = { id: '1', role: UserRole.ENGINEER };
      mockHttp.getRequest.mockReturnValue({ user: mockUser });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow(/Access denied/);
    });

    it('should return true when user has required role', () => {
      const mockUser = { id: '1', role: UserRole.ENGINEER };
      mockHttp.getRequest.mockReturnValue({ user: mockUser });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ENGINEER, UserRole.ARCHITECT]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user role is undefined', () => {
      const mockUser = { id: '1', role: undefined };
      mockHttp.getRequest.mockReturnValue({ user: mockUser });
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow(/unknown/);
    });
  });
});
