// src/services/excelExportService.ts
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { reportService } from './reportService';
import { branchService } from './branchService';
import { Timestamp } from '../firebase';
import type { DailyReportData } from '../types/report';
import type { PaymentMethod } from '../types/order';

// Helpers internos iguales a los tuyos
const getPaymentLabel = (method?: PaymentMethod) => {
    if (!method) return '-';
    if (method === 'cash') return 'Efectivo';
    if (method === 'card') return 'Tarjeta';
    if (method === 'transfer') return 'Transferencia';
    if (method === 'mixed') return 'Mixto';
    return 'Otro';
};

const getSafeDate = (val: any): Date => {
    if (!val) return new Date(); 
    if (val instanceof Timestamp) return val.toDate(); 
    if (val instanceof Date) return val; 
    return new Date(); 
};

export const excelExportService = {
  
  async downloadGlobalReport(startDate: string, endDate: string) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dulce Crepa POS';
    workbook.created = new Date();

    const start = new Date(startDate + 'T00:00:00'); 
    const end = new Date(endDate + 'T23:59:59');

    // 1. OBTENER Y DIBUJAR GLOBAL (Todas las sucursales mezcladas, sin pasar branchId)
    const globalData = await reportService.getReportByDateRange(start, end);
    this.buildBranchSheets(workbook, 'CONSOLIDADO GLOBAL', globalData, startDate, endDate, 'FF1E293B');

    // 2. OBTENER Y DIBUJAR POR SUCURSAL
    const branches = await branchService.getBranches();
    const activeBranches = branches.filter(b => b.isActive);

    for (const branch of activeBranches) {
        const branchData = await reportService.getReportByDateRange(start, end, branch.id);
        
        // Excel no permite nombres de hoja > 31 chars ni caracteres especiales
        const safeName = branch.name.replace(/[*:?/\\[\]]/g, '').substring(0, 31);
        
        // Pasamos un color verde oscuro (Teal) para las sucursales
        this.buildBranchSheets(workbook, safeName, branchData, startDate, endDate, 'FF0F766E');
    }

    // 3. DESCARGAR
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_DulceCrepa_${startDate}_al_${endDate}.xlsx`);
  },

  // --- TU MISMA LÓGICA DE DIBUJO, AHORA AISLADA PARA REPETIRSE ---
  buildBranchSheets(
      workbook: ExcelJS.Workbook, 
      branchName: string, 
      data: DailyReportData, 
      startDate: string, 
      endDate: string,
      tabColor: string
  ) {
    // Para cada sucursal/global, creamos 2 hojas como lo tenías antes,
    // pero le agregamos el nombre de la sucursal a la pestaña para no confundir.
    
    // Nombres cortos para las pestañas de Excel
    const sumName = `Resumen ${branchName.substring(0,15)}`;
    const detName = `Tickets ${branchName.substring(0,15)}`;

    const summarySheet = workbook.addWorksheet(sumName, { properties: { tabColor: { argb: tabColor } } });
    const detailsSheet = workbook.addWorksheet(detName, { properties: { tabColor: { argb: tabColor } } });

    // === HOJA 1: RESUMEN FINANCIERO ===
    summarySheet.getColumn('A').width = 35;
    summarySheet.getColumn('B').width = 25;

    summarySheet.mergeCells('A1:B1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `REPORTE FINANCIERO - ${branchName.toUpperCase()}`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    summarySheet.getCell('A2').value = 'Fecha de Generación:';
    summarySheet.getCell('B2').value = new Date().toLocaleString();
    summarySheet.getCell('A3').value = 'Periodo Analizado:';
    summarySheet.getCell('B3').value = `${startDate} al ${endDate}`;
    summarySheet.addRow([]); 

    const addSummaryRow = (label: string, value: number, isHeader = false, isTotal = false, color = '000000') => {
        const row = summarySheet.addRow([label, value]);
        const labelCell = row.getCell(1);
        const valueCell = row.getCell(2);

        labelCell.font = { bold: isHeader || isTotal, color: { argb: isHeader ? 'FF1E293B' : 'FF000000' } };
        valueCell.numFmt = '"$"#,##0.00';
        valueCell.font = { bold: isHeader || isTotal, color: { argb: color ? 'FF' + color.replace('#','') : 'FF000000' } };

        if (isHeader) {
            labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; 
            valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
            row.height = 25;
            valueCell.alignment = { vertical: 'middle' };
            labelCell.alignment = { vertical: 'middle' };
        }
        if (isTotal) {
            row.height = 30;
            labelCell.font = { size: 12, bold: true };
            valueCell.font = { size: 12, bold: true, color: { argb: data.netBalance >= 0 ? 'FF16A34A' : 'FFDC2626' } };
            labelCell.border = { top: { style: 'thick' } };
            valueCell.border = { top: { style: 'thick' } };
        }
    };

    addSummaryRow('(+) VENTAS TOTALES', data.totalSales, true);
    addSummaryRow('    Efectivo', data.cashTotal);
    addSummaryRow('    Tarjeta', data.cardTotal);
    addSummaryRow('    Transferencia', data.transferTotal);
    summarySheet.addRow([]); 
    addSummaryRow('(-) GASTOS OPERATIVOS', data.totalExpenses, true, false, 'DC2626');
    summarySheet.addRow([]); 
    addSummaryRow('(=) UTILIDAD NETA', data.netBalance, false, true);

    // === HOJA 2: DETALLE DE TICKETS ===
    detailsSheet.columns = [
        { header: 'Folio', key: 'folio', width: 10 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Fecha', key: 'fecha', width: 12 },
        { header: 'Hora', key: 'hora', width: 10 },
        { header: 'Cliente', key: 'cliente', width: 25 },
        { header: 'Modo', key: 'modo', width: 15 },
        { header: 'Método Pago', key: 'metodo', width: 15 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Cajero', key: 'cajero', width: 15 },
    ];

    const rows: any[] = [];
    data.orders.forEach(order => {
        const dateObj = getSafeDate(order.createdAt);
        const isCancelled = order.status === 'cancelled';

        rows.push({
            folio: order.orderNumber,
            estado: isCancelled ? 'CANCELADO' : 'PAGADO',
            fecha: dateObj.toLocaleDateString(),
            hora: dateObj.toLocaleTimeString(),
            cliente: order.customerName || "Cliente General",
            modo: order.mode,
            metodo: getPaymentLabel(order.payment?.method), 
            total: order.total,
            cajero: order.cashier || "Sistema",
        });
    });

    detailsSheet.addRows(rows);

    // Si hay datos, creamos la tabla bonita filtrable
    if (rows.length > 0) {
        const tableRange = `A1:I${rows.length + 1}`;
        detailsSheet.addTable({
            name: `Tabla_${branchName.replace(/[^a-zA-Z0-9]/g, '')}`,
            ref: tableRange,
            headerRow: true,
            totalsRow: false,
            style: {
                theme: 'TableStyleMedium2',
                showRowStripes: true,
            },
            columns: [
                { name: 'Folio', filterButton: true },
                { name: 'Estado', filterButton: true },
                { name: 'Fecha', filterButton: true },
                { name: 'Hora', filterButton: false },
                { name: 'Cliente', filterButton: true },
                { name: 'Modo', filterButton: true },
                { name: 'Método Pago', filterButton: true },
                { name: 'Total', filterButton: true },
                { name: 'Cajero', filterButton: true },
            ],
            rows: rows.map(r => Object.values(r))
        });
    }

    // Pintar rojos los cancelados
    detailsSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const statusCell = row.getCell(2); 
        if (statusCell.value === 'CANCELADO') {
            row.eachCell((cell) => {
                cell.font = { color: { argb: 'FFDC2626' }, strike: true }; 
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'OFFFEEF0' } }; 
            });
        }
    });

    detailsSheet.getColumn('H').numFmt = '"$"#,##0.00';
    ['A','B','C','D','H'].forEach(col => {
        detailsSheet.getColumn(col).alignment = { horizontal: 'center' };
    });
  }
};