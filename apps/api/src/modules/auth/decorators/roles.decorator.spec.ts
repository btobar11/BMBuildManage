import { ROLES_KEY, Roles } from './roles.decorator';
import { UserRole } from '../../users/user.entity';

describe('Roles Decorator', () => {
  describe('ROLES_KEY', () => {
    it('should have correct key value', () => {
      expect(ROLES_KEY).toBe('roles');
    });
  });

  describe('Roles', () => {
    it('should be a function', () => {
      expect(typeof Roles).toBe('function');
    });

    it('should accept single role', () => {
      const result = Roles(UserRole.ADMIN);
      expect(result).toBeDefined();
    });

    it('should accept multiple roles', () => {
      const result = Roles(UserRole.ADMIN, UserRole.ENGINEER);
      expect(result).toBeDefined();
    });

    it('should accept all UserRole values', () => {
      const allRoles = Object.values(UserRole);
      const result = Roles(...allRoles);
      expect(result).toBeDefined();
    });

    it('should work with no roles', () => {
      const result = Roles();
      expect(result).toBeDefined();
    });
  });
});
