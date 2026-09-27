import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeclarationTypeEntity } from '../../database/entities/declaration-type.entity.js';
import { DeclarationTypesController } from './declaration-types.controller.js';
import { DeclarationTypesService } from './declaration-types.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([DeclarationTypeEntity])],
  controllers: [DeclarationTypesController],
  providers: [DeclarationTypesService],
  exports: [DeclarationTypesService],
})
export class DeclarationTypesModule {}
