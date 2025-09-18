import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  email: string;
  organizationId: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    type: string;
    permissions: Array<{
      id: string;
      name: string;
      type: string;
      resource: string;
      action: string;
    }>;
  };
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
