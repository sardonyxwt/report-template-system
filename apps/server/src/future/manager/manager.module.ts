import { Module } from '@nestjs/common';
import { ManagerApi } from './manager.api';
import { ManagerService } from './manager.service';

/**
 * Feature module for manager role metadata and role transition endpoints.
 */
@Module({
  providers: [ManagerService],
  controllers: [ManagerApi],
})
export class ManagerFutureModule {}
