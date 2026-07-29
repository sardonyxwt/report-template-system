import { HttpStatus } from '@nestjs/common';
import {
  UserAggregateRequest,
  UserResponse,
  UsersResponse,
  UserUpdateRequest,
} from 'platform/common-base';
import { UserRole } from 'platform/prisma';
import { endpoints } from '../../../src/endpoints';
import { withAppContext } from '../../context/app.context';
import { userFixtures } from '../../fixture/user.fixture';

const { context, macros } = withAppContext();

describe('api.user', () => {
  it('create', async () => {
    const admin = await macros.createAuthorizedAdmin();

    const res = await context
      .apiCall({
        ...endpoints.user.create,
        accessToken: admin.accessToken,
      })
      .send({
        ...userFixtures.user,
        role: UserRole.Admin,
      });

    expect(res.status).toBe(HttpStatus.CREATED);

    const userData = res.body as UserResponse;
    const createdUser = await context.prisma.user.findFirst({
      where: { id: userData.id },
    });

    expect(!!createdUser).toBeTruthy();
    expect(createdUser!.role).toBe(UserRole.User);
  });

  it('update', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const user = await macros.createAuthorizedUser();

    const updateUserRequestDto: UserUpdateRequest = {
      ...user,
      fullName: 'Test name changing',
    };

    const res = await context
      .apiCall({
        ...endpoints.user.update,
        accessToken: admin.accessToken,
      })
      .send({
        ...updateUserRequestDto,
        role: UserRole.Admin,
      });

    expect(res.status).toBe(HttpStatus.OK);

    const updatedUser = await context.prisma.user.findFirst({
      where: { id: user.id },
    });

    expect(!!updatedUser).toBeTruthy();
    expect(
      updatedUser!.fullName === updateUserRequestDto.fullName,
    ).toBeTruthy();
    expect(updatedUser!.role).toBe(UserRole.User);
  });

  it('delete', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const user = await macros.createAuthorizedUser();

    const res = await context.apiCall({
      method: endpoints.user.delete.method,
      path: endpoints.user.delete.build(user.id),
      accessToken: admin.accessToken,
    });

    expect(res.status).toBe(HttpStatus.OK);

    const deletedUser = await context.prisma.user.findFirst({
      where: { id: user.id },
    });

    expect(deletedUser).toBeNull();
  });

  it('find many', async () => {
    const admin = await macros.createAuthorizedAdmin();
    const user = await macros.createAuthorizedUser();

    const userAggregateRequestDto: UserAggregateRequest = {
      where: {
        role: UserRole.User,
      },
    };

    const res = await context
      .apiCall({
        ...endpoints.user.findMany,
        accessToken: admin.accessToken,
      })
      .send(userAggregateRequestDto);

    expect(res.status).toBe(HttpStatus.OK);

    const usersData = res.body as UsersResponse;

    expect(usersData.items.find(({ id }) => user.id === id)).toBeTruthy();
  });
});
