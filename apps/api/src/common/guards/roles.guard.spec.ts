import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/users/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (
    user: any,
    handlerRoles?: UserRole[],
    classRoles?: UserRole[],
  ) => {
    const handler = { [ROLES_KEY]: handlerRoles };
    const targetClass = { [ROLES_KEY]: classRoles };

    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => handler,
      getClass: () => targetClass,
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => ({}),
      switchToWs: () => ({}),
      getType: () => 'http',
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext({ role: 'admin' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when roles array is empty', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const context = createMockContext({ role: 'admin' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const context = createMockContext(null);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should return true when user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const context = createMockContext({ role: 'admin' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has one of required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['admin', 'user']);

      const context = createMockContext({ role: 'user' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const context = createMockContext({ role: 'user' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException with correct message', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['admin', 'manager']);

      const context = createMockContext({ role: 'user' });

      try {
        guard.canActivate(context);
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenException);
        expect((e as ForbiddenException).message).toContain('admin, manager');
        expect((e as ForbiddenException).message).toContain('user');
      }
    });

    it('should check both handler and class for roles metadata', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const context = createMockContext({ role: 'admin' });
      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});
