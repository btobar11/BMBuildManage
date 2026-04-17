import { File, Loader2, Download as DownloadIcon } from 'lucide-react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import type { Budget, FinancialSummary } from '../types';

interface Props {
  budget: Budget;
  financials: FinancialSummary;
}

// Estilos corporativos simplificados para el render de PDF interno
const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { borderBottom: '2 solid #4f46e5', paddingBottom: 15, marginBottom: 20 },
  companyName: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  documentTitle: { fontSize: 16, color: '#64748b', marginTop: 5 },
  overviewBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 5, marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 10, color: '#64748b' },
  value: { fontSize: 12, color: '#0f172a', fontFamily: 'Helvetica-Bold' },
  stageHeader: { backgroundColor: '#e2e8f0', padding: 8, marginTop: 15, marginBottom: 5 },
  stageTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  itemRow: { flexDirection: 'row', borderBottom: '1 solid #f1f5f9', paddingVertical: 5 },
  itemDesc: { flex: 4, fontSize: 9 },
  itemQty: { flex: 1, fontSize: 9, textAlign: 'right' },
  itemUnit: { flex: 1, fontSize: 9, textAlign: 'center' },
  itemTotal: { flex: 2, fontSize: 9, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  totalsBox: { marginTop: 30, padding: 15, backgroundColor: '#f1f5f9', flexDirection: 'column' },
});

export const BudgetPDFDocument = ({ budget, financials }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Encabezado Corporativo */}
      <View style={styles.header}>
        <Text style={styles.companyName}>BM Build Manage</Text>
        <Text style={styles.documentTitle}>Presupuesto de Proyecto: {budget.projectName}</Text>
      </View>

      {/* Resumen Principal */}
      <View style={styles.overviewBox}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Cliente:</Text>
          <Text style={styles.value}>{budget.clientName || 'Sin Especificar'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>ID Proyecto:</Text>
          <Text style={styles.value}>{budget.id.split('-').pop()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Costo Total Estimado:</Text>
          <Text style={styles.value}>{financials.estimatedCost.toLocaleString('es-CL')} CLP</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Venta Neta (Cliente):</Text>
          <Text style={styles.value}>{Number(budget.clientPrice || 0).toLocaleString('es-CL')} {budget.currency}</Text>
        </View>
      </View>

      {/* Listado de Partidas */}
      <View>
        <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 10 }}>Desglose de Partidas</Text>
        {budget.stages?.map((stage) => (
          <View key={stage.id}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageTitle}>{stage.name}</Text>
            </View>
            {/* Cabecera tabla */}
            <View style={{ ...styles.itemRow, backgroundColor: '#f8fafc' }}>
              <Text style={{ ...styles.itemDesc, fontFamily: 'Helvetica-Bold' }}>Descripción</Text>
              <Text style={{ ...styles.itemQty, fontFamily: 'Helvetica-Bold' }}>Cant.</Text>
              <Text style={{ ...styles.itemUnit, fontFamily: 'Helvetica-Bold' }}>Unidad</Text>
              <Text style={{ ...styles.itemTotal, fontFamily: 'Helvetica-Bold' }}>Total</Text>
            </View>
            {stage.items?.map((item) => (
              <View style={styles.itemRow} key={item.id}>
                <Text style={styles.itemDesc}>{item.name || 'Partida sin nombre'}</Text>
                <Text style={styles.itemQty}>{item.quantity?.toLocaleString('es-CL') || '0'}</Text>
                <Text style={styles.itemUnit}>{item.unit}</Text>
                <Text style={styles.itemTotal}>
                   {Number(item.total_cost || 0).toLocaleString('es-CL')}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Finanzas Totales */}
      <View style={styles.totalsBox}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Utilidad Proyectada</Text>
          <Text style={styles.value}>{financials.projectedProfit.toLocaleString('es-CL')} CLP ({financials.margin}%)</Text>
        </View>
      </View>

    </Page>
  </Document>
);

export function ExportActionMenu({ budget, financials }: Props) {
  const exportToExcel = () => {
    const data: any[] = [];
    
    // Header Info
    data.push(['BM Build Manage - Presupuesto']);
    data.push(['Proyecto', budget.projectName]);
    data.push(['Cliente', budget.clientName || 'Sin Especificar']);
    data.push(['Fecha', new Date().toLocaleDateString('es-CL')]);
    data.push(['']);

    // Partidas
    data.push(['Etapa', 'Partida', 'Cantidad', 'Unidad', 'Costo Unitario', 'Total']);
    
    budget.stages?.forEach((stage) => {
      stage.items?.forEach((item) => {
        data.push([
          stage.name,
          item.name,
          item.quantity,
          item.unit,
          item.cost_per_unit || 0,
          item.total_cost || 0
        ]);
      });
      data.push(['', '', '', '', 'Subtotal Etapa', stage.total_cost || 0]);
    });

    data.push(['']);
    data.push(['', '', '', '', 'COSTO TOTAL', financials.estimatedCost]);
    data.push(['', '', '', '', 'VENTA NETA', budget.clientPrice]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Presupuesto');
    XLSX.writeFile(wb, `Presupuesto_${budget.projectName.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportToExcel}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm rounded-lg transition-colors border border-emerald-600/20"
      >
        <DownloadIcon size={16} />
        Excel
      </button>

      <PDFDownloadLink
        document={<BudgetPDFDocument budget={budget} financials={financials} />}
        fileName={`Presupuesto_${budget.projectName.replace(/\s+/g, '_')}.pdf`}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm rounded-lg transition-colors border border-indigo-600/20"
      >
        {({ loading }) => (
          loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <File size={16} />
              PDF
            </>
          )
        )}
      </PDFDownloadLink>
    </div>
  );
}
