import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { CreateAuditLogDto } from '@turbovets-task-management/data';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(createAuditLogDto);
    const savedLog = await this.auditLogRepository.save(auditLog);
    
    // Log to console for development
    console.log(`[AUDIT] ${new Date().toISOString()} - User ${createAuditLogDto.userId} performed ${createAuditLogDto.action} on ${createAuditLogDto.resource}${createAuditLogDto.resourceId ? ` (${createAuditLogDto.resourceId})` : ''}`);
    
    return savedLog;
  }

  async getLogs(userId: string, organizationId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { organizationId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100, // Limit to last 100 logs
    });
  }
}
