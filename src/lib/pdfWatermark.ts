import { PDFDocument, rgb, degrees, PageSizes } from 'pdf-lib';
import QRCode from 'qrcode';

export interface DocumentInfo {
  projectName: string;
  documentNumber: string;
  title: string;
  revision: string;
  status: 'Current' | 'Superseded';
  dateIssued: string;
  asiteDocId?: string;
}

export interface WatermarkOptions {
  headerPosition?: 'top-right' | 'top-left';
  watermarkOpacity?: number;
  qrSize?: number;
}

export class PDFWatermarkService {
  /**
   * Generate QR code data URL for document verification
   */
  static async generateQRCode(documentNumber: string, revision: string): Promise<string> {
    const checkUrl = `${window.location.origin}/check/${documentNumber}-${revision}`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(checkUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#1d1e3d', // AJ Ryan dark blue
          light: '#ffffff'
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Add watermark and QR code to PDF
   */
  static async addWatermarkToPDF(
    pdfBytes: ArrayBuffer,
    documentInfo: DocumentInfo,
    options: WatermarkOptions = {}
  ): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      // Generate QR code
      const qrDataUrl = await this.generateQRCode(documentInfo.documentNumber, documentInfo.revision);
      const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      // Define colors
      const primaryColor = rgb(0.114, 0.118, 0.239); // #1d1e3d
      const yellowColor = rgb(1, 0.812, 0.129); // #ffcf21
      const redColor = rgb(0.8, 0.2, 0.2); // Red for superseded
      const statusColor = documentInfo.status === 'Current' ? primaryColor : redColor;

      // Process each page
      for (const page of pages) {
        const { width, height } = page.getSize();

        // Add header stamp (top-right)
        const headerX = width - 220;
        const headerY = height - 30;

        // Project name
        page.drawText(`Project: ${documentInfo.projectName}`, {
          x: headerX,
          y: headerY,
          size: 8,
          color: primaryColor,
        });

        // Document number and title
        page.drawText(`${documentInfo.documentNumber}: ${documentInfo.title}`, {
          x: headerX,
          y: headerY - 15,
          size: 9,
          color: primaryColor,
        });

        // Revision and status
        const statusText = `${documentInfo.revision} - ${documentInfo.status}`;
        page.drawText(statusText, {
          x: headerX,
          y: headerY - 30,
          size: 8,
          color: statusColor,
        });

        // Date issued
        page.drawText(`Issued: ${documentInfo.dateIssued}`, {
          x: headerX,
          y: headerY - 45,
          size: 7,
          color: primaryColor,
        });

        // QR Code
        const qrDims = qrImage.scale(0.4);
        page.drawImage(qrImage, {
          x: headerX + 120,
          y: headerY - 60,
          width: qrDims.width,
          height: qrDims.height,
        });

        // Diagonal watermark
        const watermarkText = documentInfo.status === 'Current' 
          ? `AJ Ryan — Approved for Use — ${documentInfo.revision}`
          : `SUPERSEDED — DO NOT USE — Check Latest Version`;

        // Calculate diagonal position
        const centerX = width / 2;
        const centerY = height / 2;
        const diagonalAngle = Math.atan(height / width) * (180 / Math.PI);

        page.drawText(watermarkText, {
          x: centerX - 150,
          y: centerY,
          size: 24,
          color: documentInfo.status === 'Current' 
            ? rgb(0.5, 0.5, 0.5) // Grey for current
            : rgb(0.8, 0.2, 0.2), // Red for superseded
          opacity: options.watermarkOpacity || 0.3,
          rotate: degrees(-diagonalAngle),
        });

        // Footer stamp
        const footerY = 20;
        page.drawText(`AJ Ryan SmartWork Hub — Document Status: ${documentInfo.status}`, {
          x: 50,
          y: footerY,
          size: 8,
          color: statusColor,
        });

        if (documentInfo.asiteDocId) {
          page.drawText(`Asite Doc ID: ${documentInfo.asiteDocId}`, {
            x: width - 200,
            y: footerY,
            size: 8,
            color: primaryColor,
          });
        }
      }

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error adding watermark to PDF:', error);
      throw new Error('Failed to add watermark to PDF');
    }
  }

  /**
   * Create a download link for watermarked PDF
   */
  static createDownloadLink(pdfBytes: Uint8Array, filename: string): string {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }

  /**
   * Download watermarked PDF
   */
  static downloadWatermarkedPDF(pdfBytes: Uint8Array, filename: string): void {
    const downloadUrl = this.createDownloadLink(pdfBytes, filename);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }
}