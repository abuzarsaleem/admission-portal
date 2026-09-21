import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgrammeEntity } from '../../database/entities/programme.entity.js';
import { DepartmentsModule } from '../departments/departments.module.js';
import { ProgrammesController } from './programmes.controller.js';
import { ProgrammesService } from './programmes.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgrammeEntity]),
    DepartmentsModule,
  ],
  controllers: [ProgrammesController],
  providers: [ProgrammesService],
  exports: [ProgrammesService],
})
export class ProgrammesModule {}
