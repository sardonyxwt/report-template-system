import { HttpStatus } from '@nestjs/common';
import { ManagerResponse } from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';
import { managerFixtures } from '../../fixture/manager.fixture';

const { context, macros } = withAppContext();

describe('api.manager', () => {
  it('create', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const user = await macros.createAuthorizedUser();

    const res = await context
      .apiCall({
        ...endpoints.manager.create,
        accessToken: admin.accessToken,
      })
      .send(managerFixtures.manager(user.id));

    expect(res.status).toBe(HttpStatus.CREATED);

    const managerData = res.body as ManagerResponse;
    const updatedUser = await context.prisma.user.findFirst({
      where: { id: managerData.userId, manager: { isNot: null } },
      include: { manager: true },
    });

    expect(updatedUser).toBeTruthy();
    expect(updatedUser!.manager).toBeTruthy();
    expect(updatedUser!.role === UserRole.Manager).toBeTruthy();
  });

  it('delete', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const [managerData] = await macros.createAuthorizedManager(admin);

    const res = await context.apiCall({
      method: endpoints.manager.delete.method,
      path: endpoints.manager.delete.build(managerData.userId),
      accessToken: admin.accessToken,
    });

    expect(res.status).toBe(HttpStatus.OK);

    const updatedUser = await context.prisma.user.findFirst({
      where: { id: managerData.userId },
      include: { manager: true },
    });

    expect(updatedUser).toBeTruthy();
    expect(updatedUser!.manager).toBeNull();
    expect(updatedUser!.role === UserRole.User).toBeTruthy();
  });
});
