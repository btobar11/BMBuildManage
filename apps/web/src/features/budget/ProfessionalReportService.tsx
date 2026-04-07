import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import type { Budget } from './types';

export interface Company {
  name?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
}

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuBWYAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

Font.register({
  family: 'JetBrains Mono',
  src: 'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2',
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 40,
    height: 40,
  },
  logoText: {
    fontSize: 10,
    color: '#64748b',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  logoMain: {
    fontSize: 14,
    fontWeight: 700,
    color: '#020617',
  },
  projectInfo: {
    alignItems: 'flex-end',
  },
  projectName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#020617',
    marginBottom: 4,
  },
  projectMeta: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#10b981',
    marginBottom: 10,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  descriptionCell: {
    flex: 3,
    fontSize: 10,
    color: '#334155',
  },
  quantityCell: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'JetBrains Mono',
    color: '#334155',
    textAlign: 'right',
  },
  unitCell: {
    flex: 0.7,
    fontSize: 10,
    fontFamily: 'JetBrains Mono',
    color: '#64748b',
    textAlign: 'center',
  },
  priceCell: {
    flex: 1.2,
    fontSize: 10,
    fontFamily: 'JetBrains Mono',
    color: '#334155',
    textAlign: 'right',
  },
  totalCell: {
    flex: 1.3,
    fontSize: 10,
    fontFamily: 'JetBrains Mono',
    fontWeight: 600,
    color: '#020617',
    textAlign: 'right',
  },
  stageTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginTop: 4,
  },
  stageTotalLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#475569',
    marginRight: 10,
  },
  stageTotalValue: {
    fontSize: 10,
    fontFamily: 'JetBrains Mono',
    fontWeight: 700,
    color: '#020617',
  },
  summarySection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#020617',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 10,
    fontFamily: 'JetBrains Mono',
    color: '#334155',
  },
  totalBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#10b981',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#ffffff',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'JetBrains Mono',
    fontWeight: 700,
    color: '#ffffff',
  },
  bimSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  bimPlaceholder: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 30,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  pageNumber: {
    fontSize: 8,
    color: '#94a3b8',
  },
});

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export interface ReportData {
  budget: Budget;
  company?: Company;
  professionalName?: string;
  hasBimModel?: boolean;
  generalExpensesPercentage?: number;
  utilityPercentage?: number;
}

function BudgetReportDocument({ data }: { data: ReportData }) {
  const { budget, company, professionalName, hasBimModel, generalExpensesPercentage = 12, utilityPercentage = 18 } = data;

  let stageIndex = 0;
  let grandTotal = 0;
  let directCost = 0;

  const stages = budget.stages || [];
  
  for (const stage of stages) {
    let stageTotal = 0;
    for (const item of stage.items || []) {
      const total = (item.quantity || 0) * (item.unit_price || 0);
      stageTotal += total;
      directCost += (item.quantity || 0) * (item.unit_cost || 0);
    }
    grandTotal += stageTotal;
  }

  const generalExpenses = grandTotal * (generalExpensesPercentage / 100);
  const utility = grandTotal * (utilityPercentage / 100);
  const subtotal = grandTotal + generalExpenses + utility;
  const iva = subtotal * 0.19;
  const finalTotal = subtotal + iva;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <g stroke="url(#emeraldGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 4 L36 14 L20 24 L4 14 Z" />
                  <path d="M4 14 L20 24 L20 36 L4 26 Z" />
                  <path d="M20 24 L36 14 L36 26 L20 36 Z" />
                </g>
              </svg>
            </View>
            <View>
              <Text style={styles.logoMain}>BM Build Manage</Text>
              <Text style={styles.logoText}>BUILD MANAGE</Text>
            </View>
          </View>
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>{budget.projectName || 'Proyecto'}</Text>
            <Text style={styles.projectMeta}>
              {company?.name || 'Empresa'} · RUT: {company?.tax_id || 'Sin RUT'}
            </Text>
            <Text style={styles.projectMeta}>
              Fecha: {formatDate(new Date())} · Versión: {budget.version || 1}
            </Text>
            {professionalName && (
              <Text style={styles.projectMeta}>Profesional: {professionalName}</Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Partidas del Presupuesto</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Descripción</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Cant.</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.7, textAlign: 'center' }]}>Unidad</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>P. Unit.</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.3, textAlign: 'right' }]}>Total</Text>
          </View>

          {stages.map((stage) => {
            const items = stage.items || [];
            let stageTotal = 0;
            const currentStageIndex = stageIndex++;

            return (
              <View key={stage.id}>
                <View style={{ paddingVertical: 10, paddingHorizontal: 10, marginTop: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: 600, color: '#020617' }}>
                    {stage.name}
                  </Text>
                </View>
                
                {items.map((item) => {
                  const total = (item.quantity || 0) * (item.unit_price || 0);
                  stageTotal += total;

                  return (
                    <View
                      key={item.id}
                      style={currentStageIndex % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                    >
                      <Text style={[styles.descriptionCell, { flex: 3 }]}>{item.name}</Text>
                      <Text style={[styles.quantityCell, { flex: 1 }]}>
                        {(item.quantity || 0).toLocaleString('es-CL', { maximumFractionDigits: 3 })}
                      </Text>
                      <Text style={[styles.unitCell, { flex: 0.7 }]}>{item.unit || '-'}</Text>
                      <Text style={[styles.priceCell, { flex: 1.2 }]}>
                        {formatCurrency(item.unit_price || 0)}
                      </Text>
                      <Text style={[styles.totalCell, { flex: 1.3 }]}>
                        {formatCurrency(total)}
                      </Text>
                    </View>
                  );
                })}

                <View style={styles.stageTotal}>
                  <Text style={styles.stageTotalLabel}>Subtotal {stage.name}</Text>
                  <Text style={styles.stageTotalValue}>{formatCurrency(stageTotal)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Resumen Financiero</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Costo Directo</Text>
            <Text style={styles.summaryValue}>{formatCurrency(directCost)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gastos Generales ({generalExpensesPercentage}%)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(generalExpenses)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Utilidad ({utilityPercentage}%)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(utility)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>IVA (19%)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(iva)}</Text>
          </View>
          
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>TOTAL GENERAL</Text>
            <Text style={styles.totalValue}>{formatCurrency(finalTotal)}</Text>
          </View>
        </View>

        {hasBimModel && (
          <View style={styles.bimSection}>
            <Text style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>
              Modelo BIM Vinculado
            </Text>
            <Text style={styles.bimPlaceholder}>
              [Espacio para captura del visor 3D IFC]
            </Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generado por BM Build Manage · {formatDate(new Date())}
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `Página ${pageNumber} de ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
}

export async function generateBudgetPDF(data: ReportData): Promise<Blob> {
  const blob = await pdf(<BudgetReportDocument data={data} />).toBlob();
  return blob;
}

export async function downloadBudgetPDF(
  data: ReportData,
  filename?: string
): Promise<void> {
  const blob = await generateBudgetPDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `Presupuesto_${data.budget.projectName || 'Proyecto'}_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default BudgetReportDocument;
