/**
 * Dashboard PDF Template - Executive Report
 * 
 * A4 Landscape layout for BI Dashboard
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  fontFamily: 'Helvetica',
  fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  kpiBox: {
    width: '23%',
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#F9FAFB',
  },
  kpiLabel: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  col1: { width: '15%' },
  col2: { width: '20%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  col5: { width: '15%' },
  col6: { width: '20%' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9CA3AF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
});

// KPI Card Component
const KpiBox = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={styles.kpiBox}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={[styles.kpiValue, color && { color }]}>{value}</Text>
  </View>
);

// Table Row Component
const TableRow = ({ cells }: { cells: string[] }) => (
  <View style={styles.tableRow}>
    {cells.map((cell, i) => (
      <Text key={i} style={[styles.tableCell, styles[`col${i + 1}` as keyof typeof styles]]}>
        {cell}
      </Text>
    ))}
  </View>
);

/**
 * Dashboard PDF Document
 */
export function DashboardPdfDocument({
  title = 'Executive Dashboard Report',
  date = new Date().toLocaleDateString('es-CL'),
  kpis,
  clashes,
}: {
  title?: string;
  date?: string;
  kpis?: {
    progress: number;
    margin: number;
    clashes: number;
    quality: number;
  };
  clashes?: Array<{
    id: string;
    severity: string;
    status: string;
    type: string;
    discipline: string;
  }>;
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>BMBuildManage - Reporte Ejecutivo</Text>
          </View>
          <View>
            <Text style={styles.subtitle}>Fecha: {date}</Text>
          </View>
        </View>

        {/* KPIs Section */}
        {kpis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Indicadores Clave</Text>
            <View style={styles.kpiRow}>
              <KpiBox
                label="AVANCE FÍSICO"
                value={`${kpis.progress.toFixed(1)}%`}
                color={kpis.progress >= 70 ? '#10b981' : kpis.progress >= 50 ? '#F59E0B' : '#EF4444'}
              />
              <KpiBox
                label="MARGEN PROYECTADO"
                value={`$${(kpis.margin / 1000000).toFixed(1)}M`}
                color={kpis.margin > 0 ? '#10b981' : '#EF4444'}
              />
              <KpiBox
                label="CLASHES ACTIVOS"
                value={`${kpis.clashes}`}
                color={kpis.clashes === 0 ? '#10b981' : kpis.clashes <= 5 ? '#F59E0B' : '#EF4444'}
              />
              <KpiBox
                label="SCORE CALIDAD"
                value={`${kpis.quality.toFixed(1)}%`}
                color={kpis.quality >= 80 ? '#10b981' : kpis.quality >= 60 ? '#F59E0B' : '#EF4444'}
              />
            </View>
          </View>
        )}

        {/* Clashes Table */}
        {clashes && clashes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registro de Colisiones</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.col1]}>ID</Text>
                <Text style={[styles.tableHeaderCell, styles.col2]}>Severidad</Text>
                <Text style={[styles.tableHeaderCell, styles.col3]}>Estado</Text>
                <Text style={[styles.tableHeaderCell, styles.col4]}>Tipo</Text>
                <Text style={[styles.tableHeaderCell, styles.col5]}>Disciplina</Text>
                <Text style={[styles.tableHeaderCell, styles.col6]}>Fecha</Text>
              </View>
              {clashes.slice(0, 15).map((clash) => (
                <TableRow
                  key={clash.id}
                  cells={[
                    clash.id.slice(0, 8),
                    clash.severity,
                    clash.status,
                    clash.type,
                    clash.discipline,
                    date,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages} - BMBuildManage`
        } fixed />
      </Page>
    </Document>
  );
}

/**
 * Generate PDF as blob
 */
export async function generateDashboardPdf(
  kpis?: DashboardPdfDocument['props']['kpis'],
  clashes?: DashboardPdfDocument['props']['clashes']
): Promise<Blob> {
  const doc = DashboardPdfDocument({
    kpis,
    clashes,
  });
  
  const blob = await pdf(doc).toBlob();
  return blob;
}

/**
 * Download PDF
 */
export async function downloadDashboardPdf(
  kpis?: DashboardPdfDocument['props']['kpis'],
  clashes?: DashboardPdfDocument['props']['clashes']
): Promise<void> {
  const blob = await generateDashboardPdf(kpis, clashes);
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dashboard-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}