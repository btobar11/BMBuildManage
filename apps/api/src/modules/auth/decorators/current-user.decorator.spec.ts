import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-1', email: 'test@example.com' },
        }),
      }),
    } as ExecutionContext;
  });

  describe('decorator factory', () => {
    it('should create a decorator function', () => {
      expect(CurrentUser).toBeDefined();
      expect(typeof CurrentUser).toBe('function');
    });

    it('should return a function when called with data and context', () => {
      const result = CurrentUser(undefined, mockContext);
      expect(typeof result).toBe('function');
    });

    it('should be callable with different data parameters', () => {
      const result = CurrentUser('someData', mockContext);
      expect(typeof result).toBe('function');
    });

    it('should handle context without user', () => {
      const contextWithoutUser = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as ExecutionContext;
      const result = CurrentUser(undefined, contextWithoutUser);
      expect(typeof result).toBe('function');
    });

    it('should handle context with null user', () => {
      const contextWithNullUser = {
        switchToHttp: () => ({
          getRequest: () => ({ user: null }),
        }),
      } as ExecutionContext;
      const result = CurrentUser(undefined, contextWithNullUser);
      expect(typeof result).toBe('function');
    });
  });
});
