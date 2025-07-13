// Security utilities and encryption functions
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Security Types
export interface UserRole {
  id: string;
  name: 'operative' | 'supervisor' | 'pm' | 'admin' | 'dpo' | 'director';
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'export')[];
  conditions?: {
    ownDataOnly?: boolean;
    projectBased?: boolean;
    teamBased?: boolean;
    readOnlyOrgWide?: boolean;
    requiresAdmin?: boolean;
  };
}

export interface SecurityAuditLog {
  id: string;
  userId: string;
  action: 'login' | 'logout' | 'access' | 'export' | 'delete' | 'override' | 'failed_login';
  resource: string;
  resourceId?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: any;
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  category: 'personal' | 'compliance' | 'financial' | 'operational';
  retentionPeriod: number; // in months
  encryptionRequired: boolean;
}

// Encryption utilities (mock implementation - use proper crypto in production)
export class EncryptionService {
  private static key = 'mock-aes-256-key'; // Use proper key management

  static async encrypt(data: string): Promise<string> {
    // Mock implementation - use proper AES-256 encryption
    return btoa(data + '::encrypted::' + this.key);
  }

  static async decrypt(encryptedData: string): Promise<string> {
    // Mock implementation - use proper AES-256 decryption
    const decoded = atob(encryptedData);
    return decoded.replace('::encrypted::' + this.key, '');
  }

  static async hashPassword(password: string): Promise<string> {
    // Mock implementation - use bcrypt in production
    return btoa(password + '::hashed');
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Mock implementation
    const computed = await this.hashPassword(password);
    return computed === hash;
  }
}

// Role-based access control
export class RBACService {
  private static rolePermissions: Record<string, Permission[]> = {
    operative: [
      // Own data access only
      { resource: 'onboarding', actions: ['read', 'write'], conditions: { ownDataOnly: true } },
      { resource: 'my_dashboard', actions: ['read'], conditions: { ownDataOnly: true } },
      { resource: 'plots', actions: ['read'], conditions: { ownDataOnly: true } },
      { resource: 'training_matrix', actions: ['read', 'write'], conditions: { ownDataOnly: true } },
      { resource: 'rams_documents', actions: ['read'], conditions: { ownDataOnly: true } },
      { resource: 'site_notices', actions: ['read'], conditions: { ownDataOnly: true } },
      { resource: 'inductions', actions: ['read'], conditions: { ownDataOnly: true } },
      { resource: 'timesheets', actions: ['read', 'write'], conditions: { ownDataOnly: true } },
      { resource: 'pricework', actions: ['read', 'write'], conditions: { ownDataOnly: true } },
      { resource: 'on_hire_tracker', actions: ['read'], conditions: { ownDataOnly: true } },
      { resource: 'signatures', actions: ['read', 'write'], conditions: { ownDataOnly: true } },
      { resource: 'personal_data', actions: ['read', 'write'], conditions: { ownDataOnly: true } },
      { resource: 'qualifications', actions: ['read', 'write'], conditions: { ownDataOnly: true } }
    ],
    supervisor: [
      // Team-based access
      { resource: 'onboarding', actions: ['read'], conditions: { teamBased: true } },
      { resource: 'my_dashboard', actions: ['read'], conditions: { teamBased: true } },
      { resource: 'plots', actions: ['read', 'write'], conditions: { teamBased: true } },
      { resource: 'training_matrix', actions: ['read'], conditions: { teamBased: true } },
      { resource: 'rams_documents', actions: ['read'], conditions: { teamBased: true } },
      { resource: 'site_notices', actions: ['read', 'write'], conditions: { teamBased: true } },
      { resource: 'inductions', actions: ['read'], conditions: { teamBased: true } },
      { resource: 'timesheets', actions: ['read', 'write'], conditions: { teamBased: true } },
      { resource: 'pricework', actions: ['read'], conditions: { teamBased: true } },
      { resource: 'on_hire_tracker', actions: ['read', 'write'], conditions: { projectBased: true } },
      { resource: 'team_management', actions: ['read', 'write'], conditions: { teamBased: true } },
      { resource: 'compliance_data', actions: ['read'], conditions: { teamBased: true } }
    ],
    pm: [
      // Project-based access
      { resource: 'onboarding', actions: ['read'], conditions: { projectBased: true } },
      { resource: 'my_dashboard', actions: ['read'], conditions: { projectBased: true } },
      { resource: 'plots', actions: ['read', 'write'], conditions: { projectBased: true } },
      { resource: 'training_matrix', actions: ['read'], conditions: { projectBased: true } },
      { resource: 'rams_documents', actions: ['read'], conditions: { projectBased: true } },
      { resource: 'site_notices', actions: ['read', 'write'], conditions: { projectBased: true } },
      { resource: 'inductions', actions: ['read'], conditions: { projectBased: true } },
      { resource: 'timesheets', actions: ['read', 'write'], conditions: { projectBased: true } },
      { resource: 'pricework', actions: ['read', 'write'], conditions: { projectBased: true } },
      { resource: 'on_hire_tracker', actions: ['read', 'write'], conditions: { projectBased: true } },
      { resource: 'supplier_dashboard', actions: ['read'], conditions: { projectBased: true } },
      { resource: 'pm_dashboard', actions: ['read'], conditions: { projectBased: true } },
      { resource: 'project_data', actions: ['read', 'write', 'export'], conditions: { projectBased: true } },
      { resource: 'team_data', actions: ['read'], conditions: { projectBased: true } },
      { resource: 'team_management', actions: ['read', 'write'], conditions: { projectBased: true } },
      { resource: 'weekly_approvals', actions: ['read', 'write'], conditions: { projectBased: true } }
    ],
    admin: [
      // Full access to everything
      { resource: '*', actions: ['read', 'write', 'delete', 'export'] },
      { resource: 'admin_dashboard', actions: ['read', 'write'] },
      { resource: 'user_management', actions: ['read', 'write', 'delete'] },
      { resource: 'role_management', actions: ['read', 'write'] },
      { resource: 'project_management', actions: ['read', 'write', 'delete'] },
      { resource: 'security_dashboard', actions: ['read', 'write'] }
    ],
    dpo: [
      // Same as admin plus GDPR/retention powers
      { resource: '*', actions: ['read', 'write', 'delete', 'export'] },
      { resource: 'admin_dashboard', actions: ['read', 'write'] },
      { resource: 'audit_logs', actions: ['read', 'export'] },
      { resource: 'retention_policies', actions: ['read', 'write'] },
      { resource: 'gdpr_requests', actions: ['read', 'write'] },
      { resource: 'data_retention', actions: ['read', 'write', 'delete'] },
      { resource: 'privacy_dashboard', actions: ['read', 'write'] },
      { resource: 'security_dashboard', actions: ['read', 'write'] }
    ],
    director: [
      // Read-only org-wide access
      { resource: 'onboarding', actions: [], conditions: { readOnlyOrgWide: true } },
      { resource: 'my_dashboard', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'plots', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'training_matrix', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'rams_documents', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'site_notices', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'inductions', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'timesheets', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'pricework', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'on_hire_tracker', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'supplier_dashboard', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'director_dashboard', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'project_data', actions: ['read'], conditions: { readOnlyOrgWide: true } },
      { resource: 'compliance_reports', actions: ['read', 'export'], conditions: { readOnlyOrgWide: true } }
    ]
  };

  static hasPermission(
    userRole: string,
    resource: string,
    action: string,
    context?: { 
      userId?: string; 
      teamId?: string; 
      projectId?: string;
      requestingUserId?: string;
      userProjects?: string[];
      userTeams?: string[];
    }
  ): boolean {
    const permissions = this.rolePermissions[userRole] || [];
    
    // Check for wildcard admin access first
    if (userRole === 'admin' || userRole === 'dpo') {
      return true;
    }
    
    for (const permission of permissions) {
      if (permission.resource === '*' || permission.resource === resource) {
        // Check if action is allowed for this resource
        if (permission.actions.includes(action as any) || permission.conditions?.readOnlyOrgWide) {
          
          // Apply specific conditions
          if (permission.conditions?.ownDataOnly) {
            // User can only access their own data
            return context?.userId === context?.requestingUserId;
          }
          
          if (permission.conditions?.teamBased) {
            // User can access team data if they belong to the same team
            return context?.teamId && context?.userTeams?.includes(context.teamId);
          }
          
          if (permission.conditions?.projectBased) {
            // User can access project data if they're assigned to the project
            return context?.projectId && context?.userProjects?.includes(context.projectId);
          }
          
          if (permission.conditions?.readOnlyOrgWide) {
            // Director role: read-only access across all org data
            return action === 'read' || action === 'export';
          }
          
          if (permission.conditions?.requiresAdmin) {
            // Only admin/dpo can perform this action
            return userRole === 'admin' || userRole === 'dpo';
          }
          
          // No conditions means permission is granted
          if (!permission.conditions) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  // Helper method to check if user can access a specific dashboard
  static canAccessDashboard(userRole: string, dashboard: string): boolean {
    const dashboardAccess = {
      'admin': ['admin_dashboard', 'pm_dashboard', 'director_dashboard'],
      'dpo': ['admin_dashboard', 'pm_dashboard', 'director_dashboard', 'privacy_dashboard'],
      'director': ['director_dashboard'],
      'pm': ['pm_dashboard'],
      'supervisor': [],
      'operative': []
    };

    return dashboardAccess[userRole]?.includes(dashboard) || false;
  }

  // Helper method to get user's role hierarchy level
  static getRoleLevel(role: string): number {
    const hierarchy = {
      'operative': 1,
      'supervisor': 2,
      'pm': 3,
      'director': 4,
      'admin': 5,
      'dpo': 5
    };
    return hierarchy[role] || 0;
  }

  // Check if a role can manage another role
  static canManageRole(managerRole: string, targetRole: string): boolean {
    // Only admin and dpo can manage roles
    if (managerRole !== 'admin' && managerRole !== 'dpo') {
      return false;
    }
    
    // Admin and DPO can manage all roles except each other (requires special permission)
    if (targetRole === 'admin' || targetRole === 'dpo') {
      return managerRole === 'admin' || managerRole === 'dpo';
    }
    
    return true;
  }
}

// Audit logging service
export class AuditLogService {
  private static logs: SecurityAuditLog[] = [];

  static async log(logEntry: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    const entry: SecurityAuditLog = {
      ...logEntry,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    this.logs.push(entry);
    
    // In production, send to secure logging service
    console.log('Audit Log:', entry);
    
    // Store in encrypted format
    const encrypted = await EncryptionService.encrypt(JSON.stringify(entry));
    localStorage.setItem(`audit_${entry.id}`, encrypted);
  }

  static async getLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<SecurityAuditLog[]> {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }
      if (filters.resource) {
        filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
      }
      if (filters.dateFrom) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.dateTo!);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Data classification service
export class DataClassificationService {
  private static classifications: Record<string, DataClassification> = {
    personal_data: {
      level: 'restricted',
      category: 'personal',
      retentionPeriod: 24, // 2 years
      encryptionRequired: true
    },
    signatures: {
      level: 'restricted',
      category: 'compliance',
      retentionPeriod: 84, // 7 years
      encryptionRequired: true
    },
    rams_documents: {
      level: 'confidential',
      category: 'compliance',
      retentionPeriod: 144, // 12 years
      encryptionRequired: true
    },
    timesheets: {
      level: 'confidential',
      category: 'financial',
      retentionPeriod: 72, // 6 years
      encryptionRequired: true
    },
    qualifications: {
      level: 'confidential',
      category: 'compliance',
      retentionPeriod: 12, // 1 year after expiry
      encryptionRequired: true
    },
    audit_logs: {
      level: 'restricted',
      category: 'operational',
      retentionPeriod: 84, // 7 years
      encryptionRequired: true
    }
  };

  static getClassification(dataType: string): DataClassification {
    return this.classifications[dataType] || {
      level: 'internal',
      category: 'operational',
      retentionPeriod: 12,
      encryptionRequired: false
    };
  }

  static requiresEncryption(dataType: string): boolean {
    return this.getClassification(dataType).encryptionRequired;
  }
}

// Security monitoring
export class SecurityMonitoringService {
  private static suspiciousActivityThresholds = {
    failedLogins: 5,
    rapidDataAccess: 20,
    bulkExports: 3
  };

  static async detectSuspiciousActivity(userId: string): Promise<boolean> {
    const logs = await AuditLogService.getLogs({
      userId,
      dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    });

    const failedLogins = logs.filter(log => log.action === 'failed_login').length;
    const dataAccess = logs.filter(log => log.action === 'access').length;
    const exports = logs.filter(log => log.action === 'export').length;

    return (
      failedLogins >= this.suspiciousActivityThresholds.failedLogins ||
      dataAccess >= this.suspiciousActivityThresholds.rapidDataAccess ||
      exports >= this.suspiciousActivityThresholds.bulkExports
    );
  }

  static async lockUser(userId: string, reason: string): Promise<void> {
    await AuditLogService.log({
      userId,
      action: 'override',
      resource: 'user_account',
      resourceId: userId,
      ipAddress: 'system',
      userAgent: 'security_system',
      success: true,
      details: { action: 'lock_account', reason }
    });

    // In production, disable user account
    console.log(`User ${userId} locked for: ${reason}`);
  }
}