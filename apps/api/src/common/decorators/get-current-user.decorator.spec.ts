import {
  GetCurrentUserId,
  GetCurrentUserCompanyId,
} from './get-current-user.decorator';

describe('GetCurrentUser Decorators', () => {
  describe('GetCurrentUserId', () => {
    it('should be exported', () => {
      expect(GetCurrentUserId).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof GetCurrentUserId).toBe('function');
    });
  });

  describe('GetCurrentUserCompanyId', () => {
    it('should be exported', () => {
      expect(GetCurrentUserCompanyId).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof GetCurrentUserCompanyId).toBe('function');
    });
  });
});
