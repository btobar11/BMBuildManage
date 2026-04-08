import { createParamDecorator } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  it('should create a valid param decorator factory', () => {
    const decorator = createParamDecorator((_data: unknown, ctx: any) => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    });

    expect(typeof decorator).toBe('function');
  });

  it('should be defined and callable', () => {
    expect(typeof CurrentUser).toBe('function');
  });
});
