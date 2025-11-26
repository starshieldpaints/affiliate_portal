import { AdminGuard } from '../src/common/guards/admin.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const mockExecutionContext = (user: any): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user })
    })
  } as any);

describe('AdminGuard', () => {
  const guard = new AdminGuard(new Reflector());

  it('allows admin user', () => {
    const ctx = mockExecutionContext({ id: '1', role: 'admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects non-admin user', () => {
    const ctx = mockExecutionContext({ id: '2', role: 'affiliate' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects missing user', () => {
    const ctx = mockExecutionContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
