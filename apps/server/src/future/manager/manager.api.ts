import { Controller, Inject } from '@nestjs/common';
import {
  ActionNumberIdParams,
  ManagerCreateRequest,
} from 'platform/common-base';
import { Endpoint, EndpointBody, EndpointParams } from 'platform/common-server';
import { endpoints } from '../../endpoints';
import { ManagerService } from './manager.service';

/**
 * HTTP controller for manager profile administration.
 *
 * Manager endpoints intentionally operate through user ids because the manager
 * record is an extension of a user account. Business validation and role
 * transitions live in `ManagerService`.
 */
@Controller()
export class ManagerApi {
  constructor(
    @Inject(ManagerService)
    private readonly managerService: ManagerService,
  ) {}

  /**
   * Promotes a regular user to manager and creates manager-specific data.
   */
  @Endpoint(endpoints.manager.create, {
    desc: 'Create a manager.',
  })
  create(
    @EndpointBody()
    data: ManagerCreateRequest,
  ) {
    return this.managerService.create(data);
  }

  /**
   * Removes manager data and demotes the user back to a regular user.
   */
  @Endpoint(endpoints.manager.delete, {
    desc: 'Delete a manager by ID.',
  })
  delete(
    @EndpointParams()
    params: ActionNumberIdParams,
  ) {
    return this.managerService.delete(params.id);
  }
}
