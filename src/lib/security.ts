// Security utilities and encryption functions
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Security Types
export interface UserRole {
  id: string;
  name: 'operative' | 'supervisor' | 'pm' | 'admin' | 'dpo';
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'export')[];
  conditions?: {
    ownDataOnly?: boolean;
    projectBased?: boolean;
    teamBased?: boolean;
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
      {
        resource: 'personal_data',
        actions: ['read', 'write'],
        conditions: { ownDataOnly: true }
      },
      {
        resource: 'timesheets',
        actions: ['read', 'write'],
        conditions: { ownDataOnly: true }
      },
      {
        resource: 'qualifications',
        actions: ['read', 'write'],
        conditions: { ownDataOnly: true }
      }
    ],
    supervisor: [
      {
        resource: 'timesheets',
        actions: ['read', 'write'],
        conditions: { teamBased: true }
      },
      {
        resource: 'compliance_data',
        actions: ['read'],
        conditions: { teamBased: true }
      }
    ],
    pm: [
      {
        resource: 'project_data',
        actions: ['read', 'write', 'export'],
        conditions: { projectBased: true }
      },
      {
        resource: 'team_data',
        actions: ['read'],
        conditions: { projectBased: true }
      }
    ],
    admin: [
      {
        resource: '*',
        actions: ['read', 'write', 'delete', 'export']
      }
    ],
    dpo: [
      {
        resource: 'audit_logs',
        actions: ['read', 'export']
      },
      {
        resource: 'retention_policies',
        actions: ['read', 'write']
      },
      {
        resource: 'gdpr_requests',
        actions: ['read', 'write']
      }
    ]
  };

  static hasPermission(
    userRole: string,
    resource: string,
    action: string,
    context?: { userId?: string; teamId?: string; projectId?: string }
  ): boolean {
    const permissions = this.rolePermissions[userRole] || [];
    
    for (const permission of permissions) {
      if (permission.resource === '*' || permission.resource === resource) {
        if (permission.actions.includes(action as any)) {
          // Check conditions
          if (permission.conditions?.ownDataOnly && context?.userId) {
            // Additional logic for own data validation
            return true;
          }
          if (permission.conditions?.teamBased && context?.teamId) {
            // Additional logic for team-based access
            return true;
          }
          if (permission.conditions?.projectBased && context?.projectId) {
            // Additional logic for project-based access
            return true;
          }
          if (!permission.conditions) {
            return true;
          }
        }
      }
    }
    
    return false;
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