import { Module } from '@nestjs/common';
import { AuthApi } from './auth.api';
import { AuthService } from './auth.service';
import { GoogleOAuthStrategy } from './strategy/google-oauth.strategy';

/**
 * Feature module for OAuth and session-oriented authentication endpoints.
 */
@Module({
  controllers: [AuthApi],
  providers: [AuthService, GoogleOAuthStrategy],
})
export class AuthFutureModule {}
