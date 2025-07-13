// Asite API integration service for Document Register & Drawing Viewer
import { AuditLogService } from './security';

export interface AsiteDocument {
  asiteDocId: string;
  asiteRevision: string;
  drawingNumber: string;
  title: string;
  projectId: string;
  workspaceId: string;
  folderId: string;
  approvalStatus: 'approved_for_construction' | 'draft' | 'superseded' | 'pending';
  sourceSystem: 'asite' | 'local';
  lastSyncedAt: Date;
  supersededBy?: string;
  changeLog?: string;
  plotsLinked: string[];
  levelsLinked: string[];
  readRequired: boolean;
  downloadUrl?: string;
  fileSize: string;
  uploadedBy: string;
  uploadedDate: Date;
  version: string;
  type: 'drawing' | 'specification' | 'rams' | 'certificate' | 'report';
}

export interface AsiteWorkspace {
  id: string;
  name: string;
  projectId: string;
  apiKey: string;
  folderId: string;
  lastSyncDate?: Date;
  syncStatus: 'connected' | 'disconnected' | 'syncing' | 'error';
  errorMessage?: string;
}

export interface AsiteReadReceipt {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  readAt: Date;
  version: string;
  signature?: string;
  required: boolean;
}

export interface AsiteSyncResult {
  success: boolean;
  documentsUpdated: number;
  documentsSuperseded: number;
  newDocuments: number;
  errors: string[];
  lastSyncTime: Date;
}

export class AsiteApiService {
  private static baseUrl = 'https://adoddle.asite.com/adoddle/api/v2';
  private static workspaces: AsiteWorkspace[] = [];
  private static documents: AsiteDocument[] = [];
  private static readReceipts: AsiteReadReceipt[] = [];

  // Mock workspace management
  static async connectWorkspace(workspace: Omit<AsiteWorkspace, 'id' | 'syncStatus'>): Promise<string> {
    const newWorkspace: AsiteWorkspace = {
      ...workspace,
      id: crypto.randomUUID(),
      syncStatus: 'connected'
    };

    this.workspaces.push(newWorkspace);
    
    await AuditLogService.log({
      userId: 'system',
      action: 'access',
      resource: 'asite_workspace',
      resourceId: newWorkspace.id,
      ipAddress: 'system',
      userAgent: 'asite_integration',
      success: true,
      details: { action: 'workspace_connected', projectId: workspace.projectId }
    });

    return newWorkspace.id;
  }

  static async getWorkspace(projectId: string): Promise<AsiteWorkspace | null> {
    return this.workspaces.find(w => w.projectId === projectId) || null;
  }

  // Document synchronization
  static async syncDocuments(projectId: string): Promise<AsiteSyncResult> {
    const workspace = await this.getWorkspace(projectId);
    if (!workspace) {
      throw new Error('No Asite workspace configured for this project');
    }

    try {
      workspace.syncStatus = 'syncing';
      
      // Mock API call to Asite
      const mockAsiteDocuments = await this.fetchAsiteDocuments(workspace);
      
      let documentsUpdated = 0;
      let documentsSuperseded = 0;
      let newDocuments = 0;
      const errors: string[] = [];

      for (const asiteDoc of mockAsiteDocuments) {
        const existingDoc = this.documents.find(d => d.asiteDocId === asiteDoc.asiteDocId);
        
        if (existingDoc) {
          if (existingDoc.asiteRevision !== asiteDoc.asiteRevision) {
            // Supersede old version
            existingDoc.approvalStatus = 'superseded';
            existingDoc.supersededBy = asiteDoc.asiteDocId;
            documentsSuperseded++;
            
            // Add new version
            this.documents.push(asiteDoc);
            documentsUpdated++;
            
            // Clear read receipts for new version
            this.readReceipts = this.readReceipts.filter(r => r.documentId !== existingDoc.asiteDocId);
          }
        } else {
          this.documents.push(asiteDoc);
          newDocuments++;
        }
      }

      workspace.syncStatus = 'connected';
      workspace.lastSyncDate = new Date();

      await AuditLogService.log({
        userId: 'system',
        action: 'access',
        resource: 'asite_documents',
        resourceId: projectId,
        ipAddress: 'system',
        userAgent: 'asite_sync',
        success: true,
        details: { 
          action: 'sync_completed',
          documentsUpdated,
          documentsSuperseded,
          newDocuments
        }
      });

      return {
        success: true,
        documentsUpdated,
        documentsSuperseded,
        newDocuments,
        errors,
        lastSyncTime: new Date()
      };
    } catch (error) {
      workspace.syncStatus = 'error';
      workspace.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        documentsUpdated: 0,
        documentsSuperseded: 0,
        newDocuments: 0,
        errors: [workspace.errorMessage],
        lastSyncTime: new Date()
      };
    }
  }

  // Mock Asite API call
  private static async fetchAsiteDocuments(workspace: AsiteWorkspace): Promise<AsiteDocument[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock Asite response data
    return [
      {
        asiteDocId: 'asite-doc-001',
        asiteRevision: 'Rev C',
        drawingNumber: 'A1-101',
        title: 'Riser Pipework Layout - Level 2',
        projectId: workspace.projectId,
        workspaceId: workspace.id,
        folderId: workspace.folderId,
        approvalStatus: 'approved_for_construction',
        sourceSystem: 'asite',
        lastSyncedAt: new Date(),
        changeLog: 'Updated riser detail, now includes isolation valve',
        plotsLinked: ['2.05', '2.06', '2.07'],
        levelsLinked: ['Level 2'],
        readRequired: true,
        downloadUrl: '/mock/asite/docs/A1-101-RevC.pdf',
        fileSize: '2.4 MB',
        uploadedBy: 'Client Drawing Office',
        uploadedDate: new Date('2024-01-20'),
        version: 'Rev C',
        type: 'drawing'
      },
      {
        asiteDocId: 'asite-doc-002',
        asiteRevision: 'Rev B',
        drawingNumber: 'M1-205',
        title: 'Electrical Distribution - Ground Floor',
        projectId: workspace.projectId,
        workspaceId: workspace.id,
        folderId: workspace.folderId,
        approvalStatus: 'approved_for_construction',
        sourceSystem: 'asite',
        lastSyncedAt: new Date(),
        changeLog: 'Consumer unit location updated',
        plotsLinked: ['G01', 'G02', 'G03'],
        levelsLinked: ['Ground Floor'],
        readRequired: true,
        downloadUrl: '/mock/asite/docs/M1-205-RevB.pdf',
        fileSize: '3.1 MB',
        uploadedBy: 'M&E Consultant',
        uploadedDate: new Date('2024-01-18'),
        version: 'Rev B',
        type: 'drawing'
      }
    ];
  }

  // Document access and viewing
  static async getDocuments(projectId: string, filters?: {
    plotId?: string;
    levelId?: string;
    currentOnly?: boolean;
    readRequired?: boolean;
  }): Promise<AsiteDocument[]> {
    let documents = this.documents.filter(doc => doc.projectId === projectId);

    if (filters) {
      if (filters.currentOnly) {
        documents = documents.filter(doc => doc.approvalStatus === 'approved_for_construction');
      }
      if (filters.plotId) {
        documents = documents.filter(doc => doc.plotsLinked.includes(filters.plotId!));
      }
      if (filters.levelId) {
        documents = documents.filter(doc => doc.levelsLinked.includes(filters.levelId!));
      }
      if (filters.readRequired !== undefined) {
        documents = documents.filter(doc => doc.readRequired === filters.readRequired);
      }
    }

    return documents.sort((a, b) => b.uploadedDate.getTime() - a.uploadedDate.getTime());
  }

  // Read receipt management
  static async markAsRead(documentId: string, userId: string, userName: string, signature?: string): Promise<void> {
    const document = this.documents.find(d => d.asiteDocId === documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const existingReceipt = this.readReceipts.find(r => r.documentId === documentId && r.userId === userId);
    
    if (existingReceipt) {
      existingReceipt.readAt = new Date();
      existingReceipt.version = document.version;
      existingReceipt.signature = signature;
    } else {
      this.readReceipts.push({
        id: crypto.randomUUID(),
        documentId,
        userId,
        userName,
        readAt: new Date(),
        version: document.version,
        signature,
        required: document.readRequired
      });
    }

    await AuditLogService.log({
      userId,
      action: 'access',
      resource: 'asite_document',
      resourceId: documentId,
      ipAddress: 'user_device',
      userAgent: 'document_viewer',
      success: true,
      details: { 
        action: 'read_acknowledged',
        version: document.version,
        drawingNumber: document.drawingNumber
      }
    });
  }

  static async getReadStatus(documentId: string): Promise<AsiteReadReceipt[]> {
    return this.readReceipts.filter(r => r.documentId === documentId);
  }

  // Generate signed URL for document access
  static async getSignedUrl(documentId: string, userId: string): Promise<string> {
    const document = this.documents.find(d => d.asiteDocId === documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.approvalStatus !== 'approved_for_construction') {
      throw new Error('Only current approved documents can be accessed');
    }

    await AuditLogService.log({
      userId,
      action: 'access',
      resource: 'asite_document',
      resourceId: documentId,
      ipAddress: 'user_device',
      userAgent: 'document_viewer',
      success: true,
      details: { 
        action: 'document_accessed',
        drawingNumber: document.drawingNumber,
        version: document.version
      }
    });

    // Mock signed URL with expiry
    return `${document.downloadUrl}?signed=${btoa(userId + ':' + Date.now())}`;
  }

  // Export functions for compliance reporting
  static async exportReadLog(projectId: string, options?: {
    plotId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]> {
    const documents = await this.getDocuments(projectId, options);
    const exportData = [];

    for (const doc of documents) {
      const readStatus = await this.getReadStatus(doc.asiteDocId);
      exportData.push({
        drawingNumber: doc.drawingNumber,
        title: doc.title,
        version: doc.version,
        readRequired: doc.readRequired,
        totalReads: readStatus.length,
        readBy: readStatus.map(r => ({
          userName: r.userName,
          readAt: r.readAt,
          version: r.version
        }))
      });
    }

    await AuditLogService.log({
      userId: 'system',
      action: 'export',
      resource: 'read_log',
      resourceId: projectId,
      ipAddress: 'system',
      userAgent: 'export_system',
      success: true,
      details: { action: 'read_log_exported', documentsCount: documents.length }
    });

    return exportData;
  }
}

// Document viewer utilities
export class DocumentViewerService {
  static getSupportedFormats(): string[] {
    return ['.pdf', '.dwg', '.dxf', '.png', '.jpg', '.jpeg'];
  }

  static isViewableInline(fileName: string): boolean {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return ['.pdf', '.png', '.jpg', '.jpeg'].includes(extension);
  }

  static getViewerUrl(documentUrl: string, fileName: string): string {
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return `${documentUrl}#view=FitH&toolbar=1&navpanes=1`;
    }
    return documentUrl;
  }
}