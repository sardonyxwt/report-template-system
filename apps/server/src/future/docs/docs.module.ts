import { Module } from '@nestjs/common';
import { DocsApi } from './docs.api';
import { DocsService } from './docs.service';

/**
 * Feature module exposing generated API documentation endpoints.
 */
@Module({
  providers: [DocsService],
  controllers: [DocsApi],
})
export class DocsFutureModule {}
