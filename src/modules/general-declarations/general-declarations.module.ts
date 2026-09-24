import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeclarationTypeEntity } from '../../database/entities/declaration-type.entity.js';
import { GeneralDeclarationEntity } from '../../database/entities/general-declaration.entity.js';
import { GeneralDeclarationsController } from './general-declarations.controller.js';
import { GeneralDeclarationsService } from './general-declarations.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GeneralDeclarationEntity,
      DeclarationTypeEntity,
    ]),
  ],
  controllers: [GeneralDeclarationsController],
  providers: [GeneralDeclarationsService],
  exports: [GeneralDeclarationsService],
})
export class GeneralDeclarationsModule {}
