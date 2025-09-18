import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { RbacService } from '@turbovets-task-management/auth';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Organization])],
  controllers: [TasksController],
  providers: [TasksService, RbacService],
})
export class TasksModule {}
