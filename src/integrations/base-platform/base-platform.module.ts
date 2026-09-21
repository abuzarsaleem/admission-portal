import { Module } from '@nestjs/common';
import { IamModule } from './iam/iam.module.js';

@Module({
  imports: [IamModule],
  exports: [IamModule],
})
export class BasePlatformModule {}
