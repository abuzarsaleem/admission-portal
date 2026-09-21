import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportingInformationEntity } from '../../database/entities/supporting-information.entity.js';
import { ProgrammeOfferingsModule } from '../programme-offerings/programme-offerings.module.js';
import { SupportingInformationController } from './supporting-information.controller.js';
import { SupportingInformationService } from './supporting-information.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportingInformationEntity]),
    ProgrammeOfferingsModule,
  ],
  controllers: [SupportingInformationController],
  providers: [SupportingInformationService],
  exports: [SupportingInformationService],
})
export class SupportingInformationModule {}
