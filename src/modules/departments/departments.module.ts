import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentEntity } from '../../database/entities/department.entity.js';
import { ProgrammeEntity } from '../../database/entities/programme.entity.js';
import {
  DepartmentsController,
  MasterDataStatsController,
} from './departments.controller.js';
import { DepartmentsService } from './departments.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([DepartmentEntity, ProgrammeEntity])],
  controllers: [DepartmentsController, MasterDataStatsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
