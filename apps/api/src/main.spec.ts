// This test file should be excluded from CI as it requires full app initialization
// which needs Supabase environment variables that aren't available in CI

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createApp } = require('./main');

describe('main', () => {
  describe('createApp', () => {
    it('should be defined', () => {
      expect(createApp).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof createApp).toBe('function');
    });
  });
});
