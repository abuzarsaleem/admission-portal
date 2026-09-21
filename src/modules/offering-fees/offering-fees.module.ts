import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeTypeEntity } from '../../database/entities/fee-type.entity.js';
import { GeneralFeeEntity } from '../../database/entities/general-fee.entity.js';
import { OfferingFeeEntity } from '../../database/entities/offering-fee.entity.js';
import { ProgrammeOfferingsModule } from '../programme-offerings/programme-offerings.module.js';
import { OfferingFeesController } from './offering-fees.controller.js';
import { OfferingFeesService } from './offering-fees.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OfferingFeeEntity,
      GeneralFeeEntity,
      FeeTypeEntity,
    ]),
    ProgrammeOfferingsModule,
  ],
  controllers: [OfferingFeesController],
  providers: [OfferingFeesService],
  exports: [OfferingFeesService],
})
export class OfferingFeesModule {}
