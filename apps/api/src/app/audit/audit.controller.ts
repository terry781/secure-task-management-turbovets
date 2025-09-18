import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RequirePermissions, RequireRoles } from '@turbovets-task-management/auth';
import { AuditService } from './audit.service';
import { PermissionType, RoleType } from '@turbovets-task-management/data';

@Controller('audit-log')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequireRoles(RoleType.OWNER, RoleType.ADMIN)
  @RequirePermissions(PermissionType.READ_AUDIT_LOG)
  async getLogs(@Request() req: any) {
    const user = req.user;
    return this.auditService.getLogs(user.id, user.organizationId);
  }
}
