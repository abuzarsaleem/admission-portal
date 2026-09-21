import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeTypeEntity } from '../../database/entities/fee-type.entity.js';
import { GeneralFeeEntity } from '../../database/entities/general-fee.entity.js';
import { ProgrammeFeesController } from './programme-fees.controller.js';
import { ProgrammeFeesService } from './programme-fees.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([GeneralFeeEntity, FeeTypeEntity])],
  controllers: [ProgrammeFeesController],
  providers: [ProgrammeFeesService],
  exports: [ProgrammeFeesService],
})
export class ProgrammeFeesModule {}
