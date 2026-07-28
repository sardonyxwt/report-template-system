import { Inject, Injectable, Logger } from '@nestjs/common';
import { ManagerCreateRequest, ManagerResponse } from 'platform/common-base';
import { PrismaService, SessionService } from 'platform/common-server';
import { managerInclude, UserRole } from 'platform/prisma';

/**
 * Coordinates manager record mutations with the backing user role.
 *
 * Manager creation and deletion are role transitions on the related user plus
 * a manager table write, so both operations run inside a single transaction.
 */
@Injectable()
export class ManagerService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(SessionService)
    private readonly session: SessionService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Promotes a user to manager and creates the manager record transactionally.
   */
  async create(manager: ManagerCreateRequest): Promise<ManagerResponse> {
    this.session.abilityGuard('managers', 'create');

    const { ...managerFields } = manager;

    this.logger.log('Create manager requested', ManagerService.name, {
      userId: managerFields.userId,
    });

    return await this.prisma.run(async (tx) => {
      await tx.user.update({
        where: {
          id: managerFields.userId,
          role: {
            in: [UserRole.User],
          },
        },
        data: {
          role: UserRole.Manager,
        },
      });

      const createdManager = await tx.manager.create({
        data: {
          ...managerFields,
        },
        include: managerInclude.include,
      });

      this.logger.log('Manager created', ManagerService.name, {
        userId: createdManager.userId,
      });

      return createdManager;
    });
  }

  /**
   * Deletes manager data and restores the related user role to `User`.
   */
  async delete(id: number): Promise<ManagerResponse> {
    this.session.abilityGuard('managers', 'delete');

    this.logger.log('Delete manager requested', ManagerService.name, {
      userId: id,
    });

    return this.prisma.run(async (tx) => {
      await tx.user.update({
        where: {
          id,
        },
        data: {
          role: UserRole.User,
        },
      });

      const deletedManager = await tx.manager.delete({
        where: { userId: id },
        include: managerInclude.include,
      });

      this.logger.log('Manager deleted', ManagerService.name, {
        userId: deletedManager.userId,
      });

      return deletedManager;
    });
  }
}
