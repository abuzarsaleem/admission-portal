import { Module } from '@nestjs/common';
import { IamService } from './iam.service.js';

@Module({
  providers: [IamService],
  exports: [IamService],
})
export class IamModule {}
