import { Module } from '@nestjs/common';
import { UserApi } from './user.api';
import { UserService } from './user.service';

/**
 * Feature module for user administration.
 */
@Module({
  providers: [UserService],
  controllers: [UserApi],
})
export class UserFutureModule {}
