import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeTypeEntity } from '../../database/entities/fee-type.entity.js';
import { FeeTypesController } from './fee-types.controller.js';
import { FeeTypesService } from './fee-types.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([FeeTypeEntity])],
  controllers: [FeeTypesController],
  providers: [FeeTypesService],
  exports: [FeeTypesService],
})
export class FeeTypesModule {}
