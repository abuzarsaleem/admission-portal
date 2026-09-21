import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteriaTypeEntity } from '../../database/entities/criteria-type.entity.js';
import { CriteriaTypesController } from './criteria-types.controller.js';
import { CriteriaTypesService } from './criteria-types.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([CriteriaTypeEntity])],
  controllers: [CriteriaTypesController],
  providers: [CriteriaTypesService],
  exports: [CriteriaTypesService],
})
export class CriteriaTypesModule {}
