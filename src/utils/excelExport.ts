import ExcelJS from "exceljs";

export interface AttendanceReportData {
  employee: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    document_number?: string;
    position?: string;
    department?: string;
    contract_type?: string;
    daily_rate: number;
    overtime_hourly_rate: number;
    schedule_name?: string;
    shift_name?: string;
    hire_date?: string;
    allow_half_day_off?: boolean;
  };
  period: {
    start_date: string;
    end_date: string;
    total_calendar_days: number;
    report_type_label?: string;
    cycle_description?: string;
  };
  summary: {
    total_calendar_days: number;
    present_days: number;
    late_days: number;
    absent_days: number;
    justified_days: number;
    day_off_days: number;
    worked_days: number;
    total_worked_minutes: number;
    total_worked_hours_formatted: string;
    total_late_minutes: number;
    total_late_hours_formatted: string;
    total_overtime_minutes: number;
    total_overtime_hours_formatted: string;
    daily_rate: number;
    base_amount: number;
    day_7_paid_days: number;
    day_7_amount: number;
    overtime_bonus: number;
    lateness_deduction: number;
    advance_deduction: number;
    net_total_pay: number;
  };
  advances: Array<{
    id: number;
    amount: number;
    reason?: string;
    date: string;
    status: string;
  }>;
  days: Array<{
    index: number;
    date: string;
    day_name: string;
    day_short: string;
    is_sunday?: boolean;
    schedule_text: string;
    entry_time: string;
    exit_time: string;
    status: string;
    status_label: string;
    day_off_fraction: number;
    worked_minutes: number;
    worked_hours_formatted: string;
    late_minutes: number;
    late_hours_formatted: string;
    lateness_deduction: number;
    overtime_minutes: number;
    overtime_hours_formatted: string;
    overtime_bonus: number;
    day_earned_base: number;
    is_day_7_paid: boolean;
    day_total_pay: number;
    notes?: string;
  }>;
}

/**
 * Genera y descarga un archivo Excel (.xlsx) con diseño corporativo premium.
 */
export async function exportAttendanceReportToExcel(data: AttendanceReportData): Promise<void> {
  const { employee, period, summary, days, advances } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema Control de Asistencia";
  workbook.lastModifiedBy = "Sistema Control de Asistencia";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Hoja principal: Reporte Detallado
  const sheet = workbook.addWorksheet("Asistencia y Liquidación", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 16 }],
  });

  // Colores corporativos ARGB
  const COLOR_HEADER_BG = "1E3A8A"; // Azul marino profundo
  const COLOR_HEADER_TXT = "FFFFFF"; // Blanco
  const COLOR_ACCENT = "2563EB"; // Azul real
  const COLOR_ZEBRA = "F8FAFC"; // Gris muy suave
  const COLOR_CARD_BG = "F1F5F9"; // Gris azulado para cards
  const COLOR_BORDER = "CBD5E1"; // Borde suave
  const COLOR_SUCCESS = "059669"; // Verde esmeralda
  const COLOR_WARNING = "D97706"; // Ámbar
  const COLOR_DANGER = "DC2626"; // Rojo
  const COLOR_PURPLE = "7C3AED"; // Púrpura

  // ==========================================
  // 1. TÍTULO Y ENCABEZADO CORPORATIVO
  // ==========================================
  sheet.mergeCells("B2:M2");
  const titleCell = sheet.getCell("B2");
  titleCell.value = "SISTEMA DE CONTROL DE ASISTENCIA Y PLANILLA";
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: COLOR_HEADER_TXT } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
  sheet.getRow(2).height = 36;

  sheet.mergeCells("B3:M3");
  const subTitleCell = sheet.getCell("B3");
  const reportSub = period.report_type_label
    ? `REPORTE: ${period.report_type_label.toUpperCase()} - LIQUIDACIÓN EN VIVO`
    : `REPORTE DE ASISTENCIA Y LIQUIDACIÓN PROYECTADA EN TIEMPO REAL`;
  subTitleCell.value = reportSub;
  subTitleCell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "1E293B" } };
  subTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  subTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2E8F0" } };
  sheet.getRow(3).height = 24;

  sheet.mergeCells("B4:M4");
  const metaCell = sheet.getCell("B4");
  const nowFormatted = new Date().toLocaleString("es-PE");
  const cycleExtra = period.cycle_description ? `  |  ${period.cycle_description}` : "";
  metaCell.value = `Período evaluado: ${period.start_date} al ${period.end_date}${cycleExtra}  |  Emisión: ${nowFormatted}  |  Cálculo directo sin cerrar planilla`;
  metaCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "64748B" } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(4).height = 20;

  // ==========================================
  // 2. FICHA DEL COLABORADOR (Filas 6 a 9)
  // ==========================================
  sheet.mergeCells("B6:G6");
  sheet.getCell("B6").value = "DATOS DEL COLABORADOR";
  sheet.getCell("B6").font = { name: "Segoe UI", size: 11, bold: true, color: { argb: COLOR_HEADER_TXT } };
  sheet.getCell("B6").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ACCENT } };

  sheet.mergeCells("H6:M6");
  sheet.getCell("H6").value = "CONDICIÓN LABORAL Y CONTRATO";
  sheet.getCell("H6").font = { name: "Segoe UI", size: 11, bold: true, color: { argb: COLOR_HEADER_TXT } };
  sheet.getCell("H6").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ACCENT } };
  sheet.getRow(6).height = 22;

  // Fila 7
  sheet.getCell("B7").value = "Colaborador:";
  sheet.getCell("B7").font = { bold: true };
  sheet.mergeCells("C7:G7");
  sheet.getCell("C7").value = employee.full_name;

  sheet.getCell("H7").value = "Tipo Contrato:";
  sheet.getCell("H7").font = { bold: true };
  sheet.mergeCells("I7:J7");
  sheet.getCell("I7").value = employee.contract_type === "CONTRACT" ? "Planilla Mensual (4 descansos/mes)" : "Trabajo por Día";

  sheet.getCell("K7").value = "Sueldo Diario:";
  sheet.getCell("K7").font = { bold: true };
  sheet.mergeCells("L7:M7");
  sheet.getCell("L7").value = employee.daily_rate;
  sheet.getCell("L7").numFmt = '"S/ "#,##0.00';

  // Fila 8
  sheet.getCell("B8").value = "Código / DNI:";
  sheet.getCell("B8").font = { bold: true };
  sheet.mergeCells("C8:G8");
  sheet.getCell("C8").value = `${employee.employee_code}  |  DNI: ${employee.document_number || "No registrado"}`;

  sheet.getCell("H8").value = "Horario Asignado:";
  sheet.getCell("H8").font = { bold: true };
  sheet.mergeCells("I8:J8");
  sheet.getCell("I8").value = employee.schedule_name || "General";

  sheet.getCell("K8").value = "Tasa Hora Extra:";
  sheet.getCell("K8").font = { bold: true };
  sheet.mergeCells("L8:M8");
  sheet.getCell("L8").value = employee.overtime_hourly_rate;
  sheet.getCell("L8").numFmt = '"S/ "#,##0.00';

  // Fila 9
  sheet.getCell("B9").value = "Cargo / Área:";
  sheet.getCell("B9").font = { bold: true };
  sheet.mergeCells("C9:G9");
  sheet.getCell("C9").value = `${employee.position || "Operativo"}  |  ${employee.department || "Operaciones"}`;

  sheet.getCell("H9").value = "Fecha Ingreso:";
  sheet.getCell("H9").font = { bold: true };
  sheet.mergeCells("I9:J9");
  sheet.getCell("I9").value = employee.hire_date || "-";

  sheet.getCell("K9").value = "Medios Descansos:";
  sheet.getCell("K9").font = { bold: true };
  sheet.mergeCells("L9:M9");
  sheet.getCell("L9").value = employee.allow_half_day_off ? "Autorizado (0.5 días)" : "Solo Días Completos";

  // Bordes suaves para la ficha del colaborador
  for (let r = 6; r <= 9; r++) {
    for (let c = 2; c <= 13; c++) {
      const cell = sheet.getRow(r).getCell(c);
      cell.border = {
        top: { style: "thin", color: { argb: COLOR_BORDER } },
        bottom: { style: "thin", color: { argb: COLOR_BORDER } },
        left: { style: "thin", color: { argb: COLOR_BORDER } },
        right: { style: "thin", color: { argb: COLOR_BORDER } },
      };
    }
  }

  // ==========================================
  // 3. TARJETAS DE INDICADORES KPI (Filas 11 a 14)
  // ==========================================
  // Tarjeta 1: Días Laborados
  sheet.mergeCells("B11:C11");
  sheet.getCell("B11").value = "DÍAS LABORADOS";
  sheet.getCell("B11").font = { size: 9, bold: true, color: { argb: "065F46" } };
  sheet.getCell("B11").alignment = { horizontal: "center" };
  sheet.getCell("B11").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D1FAE5" } };

  sheet.mergeCells("B12:C13");
  const kpiWork = sheet.getCell("B12");
  kpiWork.value = summary.worked_days;
  kpiWork.font = { size: 18, bold: true, color: { argb: "065F46" } };
  kpiWork.alignment = { horizontal: "center", vertical: "middle" };
  kpiWork.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "ECFDF5" } };

  sheet.mergeCells("B14:C14");
  sheet.getCell("B14").value = `${summary.present_days} puntuales + ${summary.late_days} tardanzas`;
  sheet.getCell("B14").font = { size: 8, color: { argb: "065F46" } };
  sheet.getCell("B14").alignment = { horizontal: "center" };
  sheet.getCell("B14").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "ECFDF5" } };

  // Tarjeta 2: Inasistencias (Faltas)
  sheet.mergeCells("D11:E11");
  sheet.getCell("D11").value = "INASISTENCIAS (FALTAS)";
  sheet.getCell("D11").font = { size: 9, bold: true, color: { argb: "991B1B" } };
  sheet.getCell("D11").alignment = { horizontal: "center" };
  sheet.getCell("D11").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } };

  sheet.mergeCells("D12:E13");
  const kpiAbsent = sheet.getCell("D12");
  kpiAbsent.value = summary.absent_days;
  kpiAbsent.font = { size: 18, bold: true, color: { argb: "991B1B" } };
  kpiAbsent.alignment = { horizontal: "center", vertical: "middle" };
  kpiAbsent.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF2F2" } };

  sheet.mergeCells("D14:E14");
  sheet.getCell("D14").value = summary.absent_days === 0 ? "Sin inasistencias" : `${summary.absent_days} días sin laborar`;
  sheet.getCell("D14").font = { size: 8, color: { argb: "991B1B" } };
  sheet.getCell("D14").alignment = { horizontal: "center" };
  sheet.getCell("D14").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF2F2" } };

  // Tarjeta 3: Tardanzas y Descuento
  sheet.mergeCells("F11:G11");
  sheet.getCell("F11").value = "TARDANZAS TOTALES";
  sheet.getCell("F11").font = { size: 9, bold: true, color: { argb: "92400E" } };
  sheet.getCell("F11").alignment = { horizontal: "center" };
  sheet.getCell("F11").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF3C7" } };

  sheet.mergeCells("F12:G13");
  const kpiLate = sheet.getCell("F12");
  kpiLate.value = summary.total_late_hours_formatted || `${summary.total_late_minutes}m`;
  kpiLate.font = { size: 18, bold: true, color: { argb: "92400E" } };
  kpiLate.alignment = { horizontal: "center", vertical: "middle" };
  kpiLate.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBEB" } };

  sheet.mergeCells("F14:G14");
  sheet.getCell("F14").value = `Desc: S/ ${summary.lateness_deduction.toFixed(2)}`;
  sheet.getCell("F14").font = { size: 8, bold: true, color: { argb: "92400E" } };
  sheet.getCell("F14").alignment = { horizontal: "center" };
  sheet.getCell("F14").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBEB" } };

  // Tarjeta 4: Días de Descanso
  sheet.mergeCells("H11:I11");
  sheet.getCell("H11").value = "DÍAS DE DESCANSO";
  sheet.getCell("H11").font = { size: 9, bold: true, color: { argb: "5B21B6" } };
  sheet.getCell("H11").alignment = { horizontal: "center" };
  sheet.getCell("H11").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "EDE9FE" } };

  sheet.mergeCells("H12:I13");
  const kpiDayOff = sheet.getCell("H12");
  kpiDayOff.value = `${summary.day_off_days} días`;
  kpiDayOff.font = { size: 18, bold: true, color: { argb: "5B21B6" } };
  kpiDayOff.alignment = { horizontal: "center", vertical: "middle" };
  kpiDayOff.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F5F3FF" } };

  sheet.mergeCells("H14:I14");
  sheet.getCell("H14").value = `Pagados: ${summary.day_7_paid_days} días (S/ ${summary.day_7_amount.toFixed(2)})`;
  sheet.getCell("H14").font = { size: 8, color: { argb: "5B21B6" } };
  sheet.getCell("H14").alignment = { horizontal: "center" };
  sheet.getCell("H14").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F5F3FF" } };

  // Tarjeta 5: TOTAL NETO A PAGAR VERÍDICO
  sheet.mergeCells("J11:M11");
  sheet.getCell("J11").value = "TOTAL NETO A PAGAR PROYECTADO";
  sheet.getCell("J11").font = { size: 10, bold: true, color: { argb: "FFFFFF" } };
  sheet.getCell("J11").alignment = { horizontal: "center" };
  sheet.getCell("J11").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A8A" } };

  sheet.mergeCells("J12:M13");
  const kpiTotal = sheet.getCell("J12");
  kpiTotal.value = summary.net_total_pay;
  kpiTotal.font = { size: 22, bold: true, color: { argb: "047857" } };
  kpiTotal.numFmt = '"S/ "#,##0.00';
  kpiTotal.alignment = { horizontal: "center", vertical: "middle" };
  kpiTotal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D1FAE5" } };

  sheet.mergeCells("J14:M14");
  sheet.getCell("J14").value = `Base S/ ${summary.base_amount.toFixed(2)} + Descansos S/ ${summary.day_7_amount.toFixed(2)} - Adelantos S/ ${summary.advance_deduction.toFixed(2)}`;
  sheet.getCell("J14").font = { size: 8, color: { argb: "065F46" } };
  sheet.getCell("J14").alignment = { horizontal: "center" };
  sheet.getCell("J14").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D1FAE5" } };

  // ==========================================
  // 4. TABLA DETALLADA DÍA A DÍA (Fila 16)
  // ==========================================
  const headers = [
    { key: "index", label: "N°", width: 6 },
    { key: "date", label: "Fecha", width: 13 },
    { key: "day_name", label: "Día", width: 13 },
    { key: "schedule", label: "Horario Prog.", width: 14 },
    { key: "entry_time", label: "Entrada Real", width: 13 },
    { key: "exit_time", label: "Salida Real", width: 13 },
    { key: "status_label", label: "Estado / Condición", width: 22 },
    { key: "worked_hours", label: "Horas Trab.", width: 13 },
    { key: "late_min", label: "Tardanza (Min)", width: 14 },
    { key: "late_deduct", label: "Desc. Tardanza", width: 14 },
    { key: "overtime", label: "Horas Extras", width: 13 },
    { key: "overtime_bonus", label: "Bonif. H.E.", width: 13 },
    { key: "notes", label: "Observaciones / Canjes", width: 26 },
  ];

  const headerRow = sheet.getRow(16);
  headerRow.height = 28;

  headers.forEach((h, idx) => {
    const colNumber = idx + 2; // Empieza en B (col 2)
    const cell = headerRow.getCell(colNumber);
    cell.value = h.label;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: COLOR_HEADER_TXT } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    cell.border = {
      top: { style: "medium", color: { argb: "0F172A" } },
      bottom: { style: "medium", color: { argb: "0F172A" } },
      left: { style: "thin", color: { argb: "475569" } },
      right: { style: "thin", color: { argb: "475569" } },
    };
    sheet.getColumn(colNumber).width = h.width;
  });

  // Filas de días
  let currentRowNum = 17;

  days.forEach((day, i) => {
    const row = sheet.getRow(currentRowNum);
    row.height = 22;

    const isEven = i % 2 === 0;
    const bgRowColor = isEven ? "FFFFFF" : COLOR_ZEBRA;

    // Valores
    row.getCell(2).value = day.index; // N°
    row.getCell(3).value = day.date; // Fecha
    row.getCell(4).value = day.day_name; // Día
    row.getCell(5).value = day.schedule_text || "-"; // Horario
    row.getCell(6).value = day.entry_time || "-"; // Entrada
    row.getCell(7).value = day.exit_time || "-"; // Salida
    row.getCell(8).value = day.status_label; // Estado
    row.getCell(9).value = day.worked_hours_formatted || "-"; // Horas trabajadas
    row.getCell(10).value = day.late_minutes > 0 ? day.late_minutes : "-"; // Min tardanza
    row.getCell(11).value = day.lateness_deduction > 0 ? day.lateness_deduction : 0; // Descuento tardanza
    row.getCell(11).numFmt = '"S/ "#,##0.00';
    row.getCell(12).value = day.overtime_minutes > 0 ? day.overtime_hours_formatted : "-"; // Horas extras
    row.getCell(13).value = day.overtime_bonus > 0 ? day.overtime_bonus : 0; // Bonificación HE
    row.getCell(13).numFmt = '"S/ "#,##0.00';
    row.getCell(14).value = day.notes || ""; // Observaciones

    // Formatear alineaciones y fondos
    for (let c = 2; c <= 14; c++) {
      const cell = row.getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgRowColor } };
      cell.font = { name: "Segoe UI", size: 9 };
      cell.border = {
        top: { style: "thin", color: { argb: "E2E8F0" } },
        bottom: { style: "thin", color: { argb: "E2E8F0" } },
        left: { style: "thin", color: { argb: "E2E8F0" } },
        right: { style: "thin", color: { argb: "E2E8F0" } },
      };

      // Alineaciones
      if ([2, 3, 4, 5, 6, 7, 9, 10, 12].includes(c)) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if ([11, 13].includes(c)) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    }

    // Estilo especial para la celda de Estado (Columna 8 / H)
    const statusCell = row.getCell(8);
    statusCell.alignment = { horizontal: "center", vertical: "middle" };
    if (day.status === "PRESENT") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DCFCE7" } };
      statusCell.font = { bold: true, color: { argb: "166534" } };
    } else if (day.status === "LATE") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF3C7" } };
      statusCell.font = { bold: true, color: { argb: "B45309" } };
    } else if (day.status === "ABSENT") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } };
      statusCell.font = { bold: true, color: { argb: "991B1B" } };
    } else if (day.status === "DAY_OFF" || day.status === "HALF_DAY_OFF") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E0E7FF" } };
      statusCell.font = { bold: true, color: { argb: "3730A3" } };
    } else if (day.status === "JUSTIFIED") {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F3E8FF" } };
      statusCell.font = { bold: true, color: { argb: "6B21A8" } };
    }

    currentRowNum++;
  });

  // ==========================================
  // 5. CUADRO RESUMEN DE LIQUIDACIÓN AL PIE
  // ==========================================
  currentRowNum += 2;

  sheet.mergeCells(`B${currentRowNum}:G${currentRowNum}`);
  const liqHeader = sheet.getCell(`B${currentRowNum}`);
  liqHeader.value = "DESGLOSE DE LIQUIDACIÓN Y PAGO DEL PERÍODO";
  liqHeader.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: COLOR_HEADER_TXT } };
  liqHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
  sheet.getRow(currentRowNum).height = 24;

  const summaryItems = [
    { label: "(+) Sueldo Base por Días Laborados", detail: `${summary.worked_days} días a S/ ${summary.daily_rate.toFixed(2)}`, value: summary.base_amount, isPositive: true },
    { label: "(+) Remuneración Días de Descanso (Día 7)", detail: `${summary.day_7_paid_days} días (cuota mensual hasta 4 descansos)`, value: summary.day_7_amount, isPositive: true },
    { label: "(+) Bonificación por Horas Extras", detail: `${summary.total_overtime_hours_formatted} a S/ ${employee.overtime_hourly_rate.toFixed(2)}/h`, value: summary.overtime_bonus, isPositive: true },
    { label: "(-) Descuento por Minutos de Tardanza", detail: `${summary.total_late_minutes} minutos acumulados`, value: -summary.lateness_deduction, isPositive: false },
    { label: "(-) Deducción por Adelantos de Sueldo Aprobados", detail: `${advances.length} adelanto(s) registrados`, value: -summary.advance_deduction, isPositive: false },
    { label: "(=) TOTAL NETO A PAGAR PROYECTADO", detail: "Cálculo verídico en tiempo real", value: summary.net_total_pay, isTotal: true },
  ];

  summaryItems.forEach((item) => {
    currentRowNum++;
    const row = sheet.getRow(currentRowNum);
    row.height = item.isTotal ? 28 : 22;

    sheet.mergeCells(`B${currentRowNum}:D${currentRowNum}`);
    sheet.mergeCells(`E${currentRowNum}:F${currentRowNum}`);

    const cellLabel = sheet.getCell(`B${currentRowNum}`);
    cellLabel.value = item.label;
    cellLabel.font = { name: "Segoe UI", size: item.isTotal ? 11 : 9.5, bold: item.isTotal || !item.isPositive };

    const cellDetail = sheet.getCell(`E${currentRowNum}`);
    cellDetail.value = item.detail;
    cellDetail.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "64748B" } };

    const cellVal = sheet.getCell(`G${currentRowNum}`);
    cellVal.value = item.value;
    cellVal.numFmt = '"S/ "#,##0.00';
    cellVal.font = { name: "Segoe UI", size: item.isTotal ? 12 : 10, bold: true, color: { argb: item.isTotal ? "047857" : item.isPositive ? "0F172A" : "B91C1C" } };
    cellVal.alignment = { horizontal: "right", vertical: "middle" };

    const rowBg = item.isTotal ? "D1FAE5" : currentRowNum % 2 === 0 ? "FFFFFF" : COLOR_ZEBRA;
    for (let c = 2; c <= 7; c++) {
      const cell = sheet.getRow(currentRowNum).getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: item.isTotal ? "medium" : "thin", color: { argb: COLOR_BORDER } },
        bottom: { style: item.isTotal ? "medium" : "thin", color: { argb: COLOR_BORDER } },
        left: { style: "thin", color: { argb: COLOR_BORDER } },
        right: { style: "thin", color: { argb: COLOR_BORDER } },
      };
    }
  });

  // Hoja 2: Adelantos de Sueldo si existen
  if (advances.length > 0) {
    const advSheet = workbook.addWorksheet("Adelantos de Sueldo");
    advSheet.mergeCells("B2:F2");
    advSheet.getCell("B2").value = `ADELANTOS DE SUELDO - ${employee.full_name}`;
    advSheet.getCell("B2").font = { size: 14, bold: true, color: { argb: COLOR_HEADER_TXT } };
    advSheet.getCell("B2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    advSheet.getCell("B2").alignment = { horizontal: "center", vertical: "middle" };
    advSheet.getRow(2).height = 30;

    const advHeaders = ["N°", "Fecha Registro", "Monto Solicitado", "Estado", "Motivo / Justificación"];
    const advHeaderRow = advSheet.getRow(4);
    advHeaderRow.height = 24;
    advHeaders.forEach((h, i) => {
      const c = advHeaderRow.getCell(i + 2);
      c.value = h;
      c.font = { bold: true, color: { argb: "FFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ACCENT } };
      c.alignment = { horizontal: "center", vertical: "middle" };
    });

    advSheet.getColumn(2).width = 8;
    advSheet.getColumn(3).width = 16;
    advSheet.getColumn(4).width = 18;
    advSheet.getColumn(5).width = 16;
    advSheet.getColumn(6).width = 35;

    advances.forEach((adv, i) => {
      const r = advSheet.getRow(i + 5);
      r.getCell(2).value = i + 1;
      r.getCell(3).value = adv.date;
      r.getCell(4).value = adv.amount;
      r.getCell(4).numFmt = '"S/ "#,##0.00';
      r.getCell(5).value = adv.status === "APPROVED" ? "Aprobado" : adv.status === "PAID" ? "Pagado" : adv.status;
      r.getCell(6).value = adv.reason || "Sin motivo especificado";

      for (let c = 2; c <= 6; c++) {
        r.getCell(c).border = {
          top: { style: "thin", color: { argb: COLOR_BORDER } },
          bottom: { style: "thin", color: { argb: COLOR_BORDER } },
          left: { style: "thin", color: { argb: COLOR_BORDER } },
          right: { style: "thin", color: { argb: COLOR_BORDER } },
        };
      }
    });
  }

  // Generar buffer y descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const cleanCode = employee.employee_code.replace(/[^a-zA-Z0-9_-]/g, "");
  anchor.href = url;
  anchor.download = `Reporte_Asistencia_${cleanCode}_${period.start_date}_a_${period.end_date}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
