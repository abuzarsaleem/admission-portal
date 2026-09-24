import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeclarationTypeEntity } from '../../database/entities/declaration-type.entity.js';
import { GeneralDeclarationEntity } from '../../database/entities/general-declaration.entity.js';
import { OfferingDeclarationEntity } from '../../database/entities/offering-declaration.entity.js';
import { ProgrammeOfferingsModule } from '../programme-offerings/programme-offerings.module.js';
import { OfferingDeclarationsController } from './offering-declarations.controller.js';
import { OfferingDeclarationsService } from './offering-declarations.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OfferingDeclarationEntity,
      GeneralDeclarationEntity,
      DeclarationTypeEntity,
    ]),
    ProgrammeOfferingsModule,
  ],
  controllers: [OfferingDeclarationsController],
  providers: [OfferingDeclarationsService],
  exports: [OfferingDeclarationsService],
})
export class OfferingDeclarationsModule {}
