import api from '../../../lib/api';
import { supabase } from '../../../lib/supabase';

/**
 * Export Service - Excel and PDF download handlers
 * 
 * Handles authenticated exports from BI Dashboard
 */
class ExportService {
  private async getAuthToken(): Promise<string> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error('Not authenticated');
    }
    return token;
  }

  /**
   * Download Excel report
   */
  async downloadExcel(
    companyId: string,
    reportType: 'dashboard' | 'clashes' | 'budget' = 'dashboard',
    projectId?: string
  ): Promise<void> {
    const params = new URLSearchParams({
      company_id: companyId,
      ...(projectId && { project_id: projectId }),
    });

    const token = await this.getAuthToken();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-export/excel?${params}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ report_type: reportType }),
      }
    );

    if (!response.ok) {
      throw new Error(`Excel export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    this.downloadBlob(blob, `${reportType}-report-${Date.now()}.xlsx`);
  }

  /**
   * Download PDF report
   */
  async downloadPdf(
    companyId: string,
    reportType: 'dashboard' | 'clashes' | 'budget' = 'dashboard',
    projectId?: string
  ): Promise<void> {
    const params = new URLSearchParams({
      company_id: companyId,
      ...(projectId && { project_id: projectId }),
    });

    const token = await this.getAuthToken();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-export/pdf?${params}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ report_type: reportType }),
      }
    );

    if (!response.ok) {
      throw new Error(`PDF export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    this.downloadBlob(blob, `${reportType}-report-${Date.now()}.pdf`);
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();
