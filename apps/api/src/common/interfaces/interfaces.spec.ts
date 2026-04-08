import { IUser, IRequestWithUser } from './index';

describe('Interfaces', () => {
  describe('IUser', () => {
    it('should allow creating user object with required fields', () => {
      const user: IUser = {
        id: 'user-123',
        company_id: 'company-456',
        role: 'admin',
      };

      expect(user.id).toBe('user-123');
      expect(user.company_id).toBe('company-456');
      expect(user.role).toBe('admin');
    });

    it('should allow optional email field', () => {
      const userWithEmail: IUser = {
        id: 'user-123',
        email: 'test@example.com',
        company_id: 'company-456',
        role: 'admin',
      };

      const userWithoutEmail: IUser = {
        id: 'user-123',
        company_id: 'company-456',
        role: 'admin',
      };

      expect(userWithEmail.email).toBe('test@example.com');
      expect(userWithoutEmail.email).toBeUndefined();
    });
  });

  describe('IRequestWithUser', () => {
    it('should extend Request and add user property', () => {
      const requestWithUser: IRequestWithUser = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          company_id: 'company-456',
          role: 'admin',
        },
        token: 'jwt-token',
      } as any;

      expect(requestWithUser.user.id).toBe('user-123');
      expect(requestWithUser.token).toBe('jwt-token');
    });

    it('should allow optional token', () => {
      const requestWithoutToken: IRequestWithUser = {
        user: {
          id: 'user-123',
          company_id: 'company-456',
          role: 'worker',
        },
      } as any;

      expect(requestWithoutToken.user.id).toBe('user-123');
      expect(requestWithoutToken.token).toBeUndefined();
    });
  });
});
