import { Module } from '@nestjs/common';
import { ClinicApi } from './clinic.api';
import { ClinicService } from './clinic.service';

@Module({
  controllers: [ClinicApi],
  providers: [ClinicService],
})
export class ClinicFutureModule {}
