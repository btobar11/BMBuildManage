import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from './current-user.decorator';

/**
 * Parameter decorator to extract the company_id from authenticated user.
 * Usage: @CurrentCompany() companyId: string
 */
export const CurrentCompany = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser;
    return user.company_id;
  },
);
