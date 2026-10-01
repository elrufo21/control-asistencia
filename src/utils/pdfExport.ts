import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AttendanceReportData } from "./excelExport";

/**
 * Genera y descarga un documento PDF de alta calidad ejecutiva con jsPDF y jspdf-autotable.
 */
export function exportAttendanceReportToPdf(data: AttendanceReportData): void {
  const { employee, period, summary, days, advances } = data;

  // Orientación horizontal Landscape para que la tabla día a día respire con comodidad
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
  const marginX = 14;

  // Paleta de colores RGB
  const COLOR_PRIMARY = [30, 58, 138]; // #1E3A8A
  const COLOR_SECONDARY = [37, 99, 235]; // #2563EB
  const COLOR_TEXT = [15, 23, 42]; // #0F172A
  const COLOR_MUTED = [100, 116, 139]; // #64748B
  const COLOR_SUCCESS = [5, 150, 105]; // #059669
  const COLOR_WARNING = [217, 119, 6]; // #D97706
  const COLOR_DANGER = [220, 38, 38]; // #DC2626
  const COLOR_PURPLE = [124, 58, 237]; // #7C3AED
  const COLOR_BG_LIGHT = [248, 250, 252]; // #F8FAFC
  const COLOR_BORDER = [203, 213, 225]; // #CBD5E1

  // ==========================================
  // 1. CABECERA CORPORATIVA Y BANNER SUPERIOR
  // ==========================================
  // Franja superior azul marino
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(0, 0, pageWidth, 20, "F");

  // Acento delgado azul rey
  doc.setFillColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.rect(0, 20, pageWidth, 2, "F");

  // Título institucional
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("SISTEMA DE CONTROL DE ASISTENCIA Y PLANILLA", marginX, 10);

  // Subtítulo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  const pdfSubTitle = period.report_type_label
    ? `MODALIDAD: ${period.report_type_label.toUpperCase()} - LIQUIDACIÓN EN VIVO`
    : "REPORTE DETALLADO DE ASISTENCIA Y LIQUIDACIÓN PROYECTADA EN TIEMPO REAL";
  doc.text(pdfSubTitle, marginX, 16);

  // Metadatos a la derecha en la franja
  const nowStr = new Date().toLocaleString("es-PE");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Período: ${period.start_date} al ${period.end_date}`, pageWidth - marginX, 10, { align: "right" });
  doc.text(`Emisión: ${nowStr}`, pageWidth - marginX, 16, { align: "right" });

  let currentY = 26;

  // ==========================================
  // 2. CARD DE INFORMACIÓN DEL COLABORADOR
  // ==========================================
  const cardWidth = pageWidth - marginX * 2;
  const cardHeight = 22;

  doc.setFillColor(COLOR_BG_LIGHT[0], COLOR_BG_LIGHT[1], COLOR_BG_LIGHT[2]);
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, cardWidth, cardHeight, 2, 2, "FD");

  // Columna 1
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("COLABORADOR:", marginX + 4, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.setFontSize(9.5);
  doc.text(employee.full_name, marginX + 32, currentY + 6);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("CÓDIGO / DNI:", marginX + 4, currentY + 12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`${employee.employee_code}  |  DNI: ${employee.document_number || "No registrado"}`, marginX + 32, currentY + 12);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("CARGO / ÁREA:", marginX + 4, currentY + 18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`${employee.position || "Operativo"} (${employee.department || "Operaciones"})`, marginX + 32, currentY + 18);

  // Columna 2 (Mitad)
  const midX = marginX + cardWidth * 0.48;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("CONTRATO:", midX, currentY + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(employee.contract_type === "CONTRACT" ? "Planilla Mensual (4 descansos/mes)" : "Trabajo por Día", midX + 22, currentY + 6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("HORARIO:", midX, currentY + 12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(employee.schedule_name || "General", midX + 22, currentY + 12);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("INGRESO:", midX, currentY + 18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(employee.hire_date || "-", midX + 22, currentY + 18);

  // Columna 3 (Derecha)
  const rightColX = marginX + cardWidth * 0.80;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("SUELDO DIARIO:", rightColX, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_SUCCESS[0], COLOR_SUCCESS[1], COLOR_SUCCESS[2]);
  doc.setFontSize(9.5);
  doc.text(`S/ ${employee.daily_rate.toFixed(2)}`, rightColX + 28, currentY + 6);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("TASA H. EXTRA:", rightColX, currentY + 12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`S/ ${employee.overtime_hourly_rate.toFixed(2)} / h`, rightColX + 28, currentY + 12);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text("DESC. ROTATIVO:", rightColX, currentY + 18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(employee.allow_half_day_off ? "Permite 0.5 días" : "Solo completos", rightColX + 28, currentY + 18);

  currentY += cardHeight + 4;

  // ==========================================
  // 3. TARJETAS DE INDICADORES KPI
  // ==========================================
  const kpiCount = 5;
  const kpiGap = 3;
  const kpiWidth = (cardWidth - kpiGap * (kpiCount - 1)) / kpiCount;
  const kpiHeight = 15;

  const kpis = [
    {
      title: "DÍAS LABORADOS",
      value: `${summary.worked_days}`,
      sub: `${summary.present_days} asist. + ${summary.late_days} tard.`,
      color: COLOR_SUCCESS,
      bg: [236, 253, 245],
    },
    {
      title: "INASISTENCIAS",
      value: `${summary.absent_days}`,
      sub: summary.absent_days === 0 ? "Sin faltas" : `${summary.absent_days} días faltados`,
      color: COLOR_DANGER,
      bg: [254, 242, 242],
    },
    {
      title: "TARDANZAS TOTALES",
      value: summary.total_late_hours_formatted || `${summary.total_late_minutes}m`,
      sub: `Desc: S/ ${summary.lateness_deduction.toFixed(2)}`,
      color: COLOR_WARNING,
      bg: [255, 251, 235],
    },
    {
      title: "DÍAS DE DESCANSO",
      value: `${summary.day_off_days} días`,
      sub: `Pagados: ${summary.day_7_paid_days} (S/ ${summary.day_7_amount.toFixed(2)})`,
      color: COLOR_PURPLE,
      bg: [245, 243, 255],
    },
    {
      title: "TOTAL A PAGAR",
      value: `S/ ${summary.net_total_pay.toFixed(2)}`,
      sub: "Neto proyectado verídico",
      color: COLOR_PRIMARY,
      bg: [209, 250, 229],
      isHighlight: true,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const kX = marginX + idx * (kpiWidth + kpiGap);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.setLineWidth(kpi.isHighlight ? 0.6 : 0.3);
    doc.roundedRect(kX, currentY, kpiWidth, kpiHeight, 1.5, 1.5, "FD");

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.title, kX + kpiWidth / 2, currentY + 3.8, { align: "center" });

    doc.setFontSize(kpi.isHighlight ? 11 : 9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(kpi.isHighlight ? COLOR_SUCCESS[0] : kpi.color[0], kpi.isHighlight ? COLOR_SUCCESS[1] : kpi.color[1], kpi.isHighlight ? COLOR_SUCCESS[2] : kpi.color[2]);
    doc.text(kpi.value, kX + kpiWidth / 2, currentY + 9.5, { align: "center" });

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(kpi.sub, kX + kpiWidth / 2, currentY + 13.5, { align: "center" });
  });

  currentY += kpiHeight + 4;

  // ==========================================
  // 4. TABLA DETALLADA DÍA POR DÍA CON AUTOTABLE
  // ==========================================
  const tableData = days.map((d) => [
    d.index,
    d.date,
    d.day_name,
    d.schedule_text || "-",
    d.entry_time || "-",
    d.exit_time || "-",
    d.status_label,
    d.worked_hours_formatted || "-",
    d.late_minutes > 0 ? `${d.late_minutes} min` : "-",
    d.lateness_deduction > 0 ? `S/ ${d.lateness_deduction.toFixed(2)}` : "-",
    d.overtime_minutes > 0 ? d.overtime_hours_formatted : "-",
    d.overtime_bonus > 0 ? `S/ ${d.overtime_bonus.toFixed(2)}` : "-",
    d.day_total_pay > 0 ? `S/ ${d.day_total_pay.toFixed(2)}` : "-",
    d.notes || "",
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [[
      "N°", "Fecha", "Día", "Horario", "Entrada", "Salida",
      "Estado / Condición", "Horas", "Tardanza", "Desc. Tard.", "H. Extras", "Bonif. HE", "Pago Día", "Observaciones",
    ]],
    body: tableData,
    margin: { left: marginX, right: marginX, bottom: 22 },
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      valign: "middle",
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: "helvetica",
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "center", cellWidth: 17 },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "center", cellWidth: 14 },
      5: { halign: "center", cellWidth: 14 },
      6: { halign: "left", cellWidth: 32 },
      7: { halign: "center", cellWidth: 15 },
      8: { halign: "center", cellWidth: 16 },
      9: { halign: "right", cellWidth: 17 },
      10: { halign: "center", cellWidth: 15 },
      11: { halign: "right", cellWidth: 16 },
      12: { halign: "right", cellWidth: 16 },
      13: { halign: "left", cellWidth: "auto" },
    },
    didParseCell: (hookData) => {
      // Formato y colores según el estado
      if (hookData.section === "body" && hookData.column.index === 6) {
        const text = String(hookData.cell.raw);
        if (text.includes("Asistió")) {
          hookData.cell.styles.textColor = [22, 101, 52];
          hookData.cell.styles.fontStyle = "bold";
        } else if (text.includes("Tardanza")) {
          hookData.cell.styles.textColor = [180, 83, 9];
          hookData.cell.styles.fontStyle = "bold";
        } else if (text.includes("Inasistencia") || text.includes("No vino")) {
          hookData.cell.styles.textColor = [185, 28, 28];
          hookData.cell.styles.fontStyle = "bold";
        } else if (text.includes("Descanso")) {
          hookData.cell.styles.textColor = [55, 48, 163];
          hookData.cell.styles.fontStyle = "bold";
        } else if (text.includes("Justificado")) {
          hookData.cell.styles.textColor = [107, 33, 168];
          hookData.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // ==========================================
  // 5. CUADRO RESUMEN DE LIQUIDACIÓN Y FIRMAS AL FINAL
  // ==========================================
  const finalY = (doc as any).lastAutoTable.finalY + 4;

  // Si queda poco espacio en la página, crear una nueva página
  let summaryY = finalY;
  if (summaryY > pageHeight - 45) {
    doc.addPage();
    summaryY = 16;
  }

  // Cuadro de Liquidación
  const liqWidth = 140;
  doc.setFillColor(COLOR_BG_LIGHT[0], COLOR_BG_LIGHT[1], COLOR_BG_LIGHT[2]);
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, summaryY, liqWidth, 34, 1.5, 1.5, "FD");

  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(marginX, summaryY, liqWidth, 6, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DESGLOSE DE LIQUIDACIÓN Y PAGO DEL PERÍODO", marginX + 4, summaryY + 4.2);

  const liqLines = [
    { label: "(+) Sueldo Base (Días Laborados):", val: `S/ ${summary.base_amount.toFixed(2)} (${summary.worked_days} días)` },
    { label: "(+) Remuneración Días de Descanso (Día 7):", val: `S/ ${summary.day_7_amount.toFixed(2)} (${summary.day_7_paid_days} descansos pagados)` },
    { label: "(+) Bonificación Horas Extras:", val: `S/ ${summary.overtime_bonus.toFixed(2)} (${summary.total_overtime_hours_formatted})` },
    { label: "(-) Descuento por Tardanzas:", val: `- S/ ${summary.lateness_deduction.toFixed(2)} (${summary.total_late_minutes} min)` },
    { label: "(-) Deducción Adelantos de Sueldo:", val: `- S/ ${summary.advance_deduction.toFixed(2)} (${advances.length} adelanto(s))` },
  ];

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

  let lY = summaryY + 10;
  liqLines.forEach((line) => {
    doc.text(line.label, marginX + 4, lY);
    doc.text(line.val, marginX + liqWidth - 4, lY, { align: "right" });
    lY += 4;
  });

  // Franja total a pagar
  doc.setFillColor(209, 250, 229);
  doc.rect(marginX + 0.3, summaryY + 28, liqWidth - 0.6, 5.7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  doc.text("(=) TOTAL NETO A PAGAR PROYECTADO:", marginX + 4, summaryY + 32);
  doc.text(`S/ ${summary.net_total_pay.toFixed(2)}`, marginX + liqWidth - 4, summaryY + 32, { align: "right" });

  // Espacio para firmas a la derecha
  const sigX = marginX + liqWidth + 14;
  const sigWidth = pageWidth - sigX - marginX;

  // Firma trabajador
  const sigBoxW = (sigWidth - 10) / 2;
  const sigY = summaryY + 24;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(sigX, sigY, sigX + sigBoxW, sigY);
  doc.line(sigX + sigBoxW + 10, sigY, sigX + sigBoxW * 2 + 10, sigY);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text("Firma del Trabajador", sigX + sigBoxW / 2, sigY + 3.5, { align: "center" });
  doc.text(`DNI: ${employee.document_number || "_______________"}`, sigX + sigBoxW / 2, sigY + 6.5, { align: "center" });

  doc.text("Administración / RRHH", sigX + sigBoxW + 10 + sigBoxW / 2, sigY + 3.5, { align: "center" });
  doc.text("Sello y Conformidad", sigX + sigBoxW + 10 + sigBoxW / 2, sigY + 6.5, { align: "center" });

  // ==========================================
  // 6. NUMERACIÓN DE PÁGINAS EN EL FOOTER
  // ==========================================
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(
      `Página ${p} de ${totalPages}  |  Sistema de Control de Asistencia y Liquidación  |  Documento confidencial para uso interno`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );
  }

  // Guardar y descargar PDF
  const cleanCode = employee.employee_code.replace(/[^a-zA-Z0-9_-]/g, "");
  doc.save(`Reporte_Asistencia_${cleanCode}_${period.start_date}_a_${period.end_date}.pdf`);
}
