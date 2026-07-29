import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  UserAggregateRequest,
  UserCreateRequest,
  UserResponse,
  UsersResponse,
  UserUpdateRequest,
} from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { userInclude, UserRole } from 'platform/prisma';

/**
 * Implements user administration rules.
 *
 * All public mutations enforce `SessionService` abilities before changing data.
 */
@Injectable()
export class UserService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(SessionService)
    private readonly session: SessionService,
  ) {}

  /**
   * Creates a user after checking create permissions.
   */
  async create(data: UserCreateRequest): Promise<UserResponse> {
    this.session.abilityGuard('users', 'create');

    const { ...userFields } = data;

    this.logger.log('Create user requested', UserService.name);

    const createdUser = await this.prisma.tx.user.create({
      data: {
        ...userFields,
        role: UserRole.User,
      },
      include: userInclude.include,
    });

    this.logger.log('User created', UserService.name, {
      userId: createdUser.id,
    });

    return createdUser;
  }

  /**
   * Updates user fields. Role transitions are handled by manager operations.
   */
  async update(data: UserUpdateRequest): Promise<UserResponse> {
    const { ...userFields } = data;

    this.logger.log('Update user requested', UserService.name, {
      userId: userFields.id,
    });

    const updatingUser = await this.prisma.tx.user.findFirstOrThrow({
      where: { id: userFields.id },
    });

    this.session.abilityGuard('users', 'update', {
      user: updatingUser,
      updates: userFields,
    });

    this.logger.log('Update user started', UserService.name, {
      userId: userFields.id,
    });

    const updatedUser = await this.prisma.tx.user.update({
      data: {
        ...userFields,
      },
      where: {
        id: userFields.id,
      },
      include: userInclude.include,
    });

    this.logger.log('User updated', UserService.name, {
      userId: updatedUser.id,
    });

    return updatedUser;
  }

  /**
   * Deletes a user after checking role-specific delete permissions.
   */
  async delete(id: number): Promise<UserResponse> {
    this.logger.log('Delete user requested', UserService.name, { userId: id });

    const userToDelete = await this.prisma.tx.user.findFirstOrThrow({
      where: { id },
    });

    this.session.abilityGuard('users', 'delete', {
      role: userToDelete.role,
    });

    const deletedUser = await this.prisma.tx.user.delete({
      where: { id },
      include: userInclude.include,
    });

    this.logger.log('User deleted', UserService.name, {
      userId: deletedUser.id,
    });

    return deletedUser;
  }

  /**
   * Finds users using the shared aggregate query shape and applies per-row read
   * authorization before returning the list.
   */
  async findMany({
    where,
    orderBy,
    cursor,
    take,
    skip,
  }: UserAggregateRequest): Promise<UsersResponse> {
    const [items, total] = await this.prisma.runAll((tx) => [
      tx.user.findMany({
        where,
        orderBy,
        cursor,
        take,
        skip,
        include: userInclude.include,
      }),
      tx.user.count({ where }),
    ]);

    for (const user of items) {
      this.session.abilityGuard('users', 'read', {
        userId: user.id,
      });
    }

    return { items, total, perPage: take ?? total };
  }
}
