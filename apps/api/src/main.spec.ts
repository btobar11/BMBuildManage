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
