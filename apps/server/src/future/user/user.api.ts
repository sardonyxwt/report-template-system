import { Controller, Inject } from '@nestjs/common';
import {
  ActionNumberIdParams,
  UserAggregateRequest,
  UserCreateRequest,
  UserUpdateRequest,
} from 'platform/common-base';
import { Endpoint, EndpointBody, EndpointParams } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { UserService } from './user.service';

/**
 * Contract-backed HTTP controller for user administration.
 *
 * The controller intentionally delegates authorization and Prisma writes to
 * `UserService`; it only adapts validated endpoint body/params into service
 * calls.
 */
@Controller()
export class UserApi {
  constructor(
    @Inject(UserService)
    private readonly userService: UserService,
  ) {}

  /**
   * Creates a user.
   */
  @Endpoint(endpoints.user.create, {
    desc: 'Create a user.',
  })
  create(
    @EndpointBody()
    data: UserCreateRequest,
  ) {
    return this.userService.create(data);
  }

  /**
   * Updates editable user fields.
   */
  @Endpoint(endpoints.user.update, {
    desc: 'Update a user.',
  })
  update(
    @EndpointBody()
    data: UserUpdateRequest,
  ) {
    return this.userService.update(data);
  }

  /**
   * Deletes a user by numeric route id.
   */
  @Endpoint(endpoints.user.delete, {
    desc: 'Delete a user by ID.',
  })
  delete(
    @EndpointParams()
    params: ActionNumberIdParams,
  ) {
    return this.userService.delete(params.id);
  }

  /**
   * Returns a filtered user page with total count metadata.
   */
  @Endpoint(endpoints.user.findMany, {
    desc: 'Find users matching aggregate query criteria.',
  })
  findMany(
    @EndpointBody()
    data: UserAggregateRequest,
  ) {
    return this.userService.findMany(data);
  }
}
