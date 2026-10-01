import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  ToggleButton,
  ToggleButtonGroup,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonIcon from "@mui/icons-material/Person";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableViewIcon from "@mui/icons-material/TableView";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import DateRangeIcon from "@mui/icons-material/DateRange";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { apiFetch } from "../services/api";
import { exportAttendanceReportToExcel, AttendanceReportData } from "../utils/excelExport";
import { exportAttendanceReportToPdf } from "../utils/pdfExport";
import {
  getLocalTodayStr,
  getFirstDayOfMonthStr,
  getLastDayOfMonthStr,
  generateEmployeeLaborCycles,
  EmployeeLaborCycle,
  formatAttendanceDate,
} from "../utils/dateUtils";

interface AttendanceReportModalProps {
  open: boolean;
  onClose: () => void;
  initialEmployeeId?: number | string | null;
  initialStartDate?: string;
  initialEndDate?: string;
}

export const AttendanceReportModal: React.FC<AttendanceReportModalProps> = ({
  open,
  onClose,
  initialEmployeeId,
  initialStartDate,
  initialEndDate,
}) => {
  // Lista de empleados disponibles
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");

  // Rango de fechas
  const todayStr = getLocalTodayStr();
  const [currentYearStr, currentMonthStr] = todayStr.split("-");
  const currentYear = Number(currentYearStr);
  const currentMonthNum = Number(currentMonthStr);
  const defaultMonthStr = `${currentYearStr}-${currentMonthStr}`;

  // Modos de período: CYCLE (según ingreso) | MONTH (mes calendario) | CUSTOM (fecha a fecha)
  const [dateMode, setDateMode] = useState<"CYCLE" | "MONTH" | "CUSTOM">("CYCLE");
  const [selectedCycleId, setSelectedCycleId] = useState<string>("cycle-0");
  const [cutoffMode, setCutoffMode] = useState<"30_DAYS" | "SAME_DAY">("30_DAYS");
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthStr);
  const [startDate, setStartDate] = useState<string>(
    initialStartDate || getFirstDayOfMonthStr(currentYear, currentMonthNum)
  );
  const [endDate, setEndDate] = useState<string>(
    initialEndDate || getLastDayOfMonthStr(currentYear, currentMonthNum)
  );

  // Datos del reporte
  const [reportData, setReportData] = useState<AttendanceReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros internos de visualización
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<number>(0);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Empleado seleccionado actualmente
  const selectedEmp = useMemo(() => {
    return employees.find((e) => String(e.id) === String(selectedEmpId));
  }, [employees, selectedEmpId]);

  // Ciclos laborales calculados según fecha de ingreso
  const laborCycles = useMemo<EmployeeLaborCycle[]>(() => {
    if (!selectedEmp?.hire_date) return [];
    return generateEmployeeLaborCycles(selectedEmp.hire_date, new Date(), 6);
  }, [selectedEmp]);

  // Cargar lista de empleados al abrir
  useEffect(() => {
    if (open) {
      loadEmployees();
    }
  }, [open]);

  // Si cambia el empleado inicial por prop
  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmpId(String(initialEmployeeId));
    }
  }, [initialEmployeeId]);

  // Cuando cambia el empleado seleccionado, inicializar su ciclo o mes
  useEffect(() => {
    if (!selectedEmp) return;

    if (selectedEmp.hire_date) {
      const cycles = generateEmployeeLaborCycles(selectedEmp.hire_date, new Date(), 6);
      if (cycles.length > 0) {
        const cur = cycles[0];
        setSelectedCycleId(cur.id);
        if (dateMode === "CYCLE") {
          setStartDate(cur.startDate);
          setEndDate(cutoffMode === "SAME_DAY" ? cur.endDateSameDay : cur.endDate30Days);
        }
      }
    } else {
      // Si el empleado no tiene fecha de ingreso, conmutar a mes calendario
      if (dateMode === "CYCLE") {
        setDateMode("MONTH");
        applyMonth(selectedMonth);
      }
    }
  }, [selectedEmpId]);

  // Al cambiar empleado, fechas o modalidad, recargar el reporte
  useEffect(() => {
    if (open && selectedEmpId && startDate && endDate) {
      fetchReport();
    }
  }, [open, selectedEmpId, startDate, endDate, dateMode, cutoffMode]);

  async function loadEmployees() {
    try {
      const data = await apiFetch("/employees?status=ACTIVE");
      const list = data.items || [];
      setEmployees(list);
      if (!selectedEmpId && list.length > 0) {
        const defaultId = initialEmployeeId ? String(initialEmployeeId) : String(list[0].id);
        setSelectedEmpId(defaultId);
      }
    } catch (e: any) {
      console.error("Error al cargar empleados:", e);
    }
  }

  // Aplicar un ciclo laboral específico
  const applyCycle = (cycleId: string, currentCutoff: "30_DAYS" | "SAME_DAY" = cutoffMode) => {
    const cycle = laborCycles.find((c) => c.id === cycleId) || laborCycles[0];
    if (cycle) {
      setSelectedCycleId(cycle.id);
      setStartDate(cycle.startDate);
      setEndDate(currentCutoff === "SAME_DAY" ? cycle.endDateSameDay : cycle.endDate30Days);
    }
  };

  // Aplicar un mes calendario específico
  const applyMonth = (mStr: string) => {
    setSelectedMonth(mStr);
    const [yStr, mNumStr] = mStr.split("-");
    const y = Number(yStr);
    const m = Number(mNumStr);
    setStartDate(getFirstDayOfMonthStr(y, m));
    setEndDate(getLastDayOfMonthStr(y, m));
  };

  // Cambio de modalidad de fecha
  const handleModeChange = (newMode: "CYCLE" | "MONTH" | "CUSTOM") => {
    if (!newMode) return;
    setDateMode(newMode);
    if (newMode === "CYCLE") {
      if (laborCycles.length > 0) {
        applyCycle(selectedCycleId || laborCycles[0].id, cutoffMode);
      }
    } else if (newMode === "MONTH") {
      applyMonth(selectedMonth);
    }
  };

  // Cambio de tipo de corte dentro del ciclo
  const handleCutoffChange = (newCutoff: "30_DAYS" | "SAME_DAY") => {
    setCutoffMode(newCutoff);
    if (dateMode === "CYCLE" && laborCycles.length > 0) {
      applyCycle(selectedCycleId, newCutoff);
    }
  };

  async function fetchReport() {
    if (!selectedEmpId) return;
    setLoading(true);
    setError(null);

    try {
      let url = `/reports/employee-attendance?employee_id=${selectedEmpId}&start_date=${startDate}&end_date=${endDate}`;
      const res: AttendanceReportData = await apiFetch(url);

      // Inyectar metadatos claros de período para UI, Excel y PDF
      let reportTypeLabel = "";
      let cycleDesc = "";

      if (dateMode === "CYCLE") {
        const anchor = selectedEmp?.hire_date ? Number(String(selectedEmp.hire_date).slice(8, 10)) : 1;
        reportTypeLabel = `Ciclo Laboral (Día ${anchor} de cada mes)`;
        cycleDesc = cutoffMode === "SAME_DAY"
          ? `Corte hasta día de pago (del ${String(anchor).padStart(2, "0")} al ${String(anchor).padStart(2, "0")} inclusive)`
          : `Ciclo estándar de 30 días (del ${String(anchor).padStart(2, "0")} al día anterior)`;
      } else if (dateMode === "MONTH") {
        const [y, m] = selectedMonth.split("-");
        const monthNames = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const mName = monthNames[Number(m) - 1] || selectedMonth;
        reportTypeLabel = `Reporte Mensual (${mName} ${y})`;
        cycleDesc = `Mes calendario completo (01 al ${res.period?.total_calendar_days || 30})`;
      } else {
        reportTypeLabel = `Rango Personalizado`;
        cycleDesc = `Del ${startDate} al ${endDate}`;
      }

      if (res && res.period) {
        res.period.report_type_label = reportTypeLabel;
        res.period.cycle_description = cycleDesc;
      }

      setReportData(res);
    } catch (e: any) {
      console.error("Error al cargar reporte:", e);
      setError(e.message || "Error al obtener la información de asistencia.");
    } finally {
      setLoading(false);
    }
  }

  // Atajos rápidos de fecha
  const applyQuickRange = (type: "THIS_MONTH" | "LAST_MONTH" | "LAST_15_DAYS" | "LAST_30_DAYS" | "HIRE_CYCLE") => {
    const today = new Date();
    if (type === "THIS_MONTH") {
      setDateMode("MONTH");
      const mStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      applyMonth(mStr);
    } else if (type === "LAST_MONTH") {
      setDateMode("MONTH");
      const lastM = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const mStr = `${lastM.getFullYear()}-${String(lastM.getMonth() + 1).padStart(2, "0")}`;
      applyMonth(mStr);
    } else if (type === "HIRE_CYCLE") {
      setDateMode("CYCLE");
      if (laborCycles.length > 0) {
        applyCycle(laborCycles[0].id, cutoffMode);
      }
    } else if (type === "LAST_15_DAYS") {
      setDateMode("CUSTOM");
      const past15 = new Date();
      past15.setDate(past15.getDate() - 14);
      setStartDate(getLocalTodayStr(past15));
      setEndDate(getLocalTodayStr());
    } else if (type === "LAST_30_DAYS") {
      setDateMode("CUSTOM");
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      setStartDate(getLocalTodayStr(past30));
      setEndDate(getLocalTodayStr());
    }
  };

  // Manejar exportación Excel
  const handleExportExcel = async () => {
    if (!reportData) return;
    try {
      setExportingExcel(true);
      await exportAttendanceReportToExcel(reportData);
    } catch (err: any) {
      console.error("Error exportando a Excel:", err);
      alert("Ocurrió un error al generar el archivo Excel: " + (err.message || ""));
    } finally {
      setExportingExcel(false);
    }
  };

  // Manejar exportación PDF
  const handleExportPdf = () => {
    if (!reportData) return;
    try {
      setExportingPdf(true);
      exportAttendanceReportToPdf(reportData);
    } catch (err: any) {
      console.error("Error exportando a PDF:", err);
      alert("Ocurrió un error al generar el archivo PDF: " + (err.message || ""));
    } finally {
      setExportingPdf(false);
    }
  };

  // Filtrado de días
  const filteredDays = useMemo(() => {
    if (!reportData?.days) return [];
    if (statusFilter === "ALL") return reportData.days;
    if (statusFilter === "PRESENT") return reportData.days.filter((d) => d.status === "PRESENT");
    if (statusFilter === "LATE") return reportData.days.filter((d) => d.status === "LATE");
    if (statusFilter === "ABSENT") return reportData.days.filter((d) => d.status === "ABSENT");
    if (statusFilter === "DAY_OFF") return reportData.days.filter((d) => d.status === "DAY_OFF" || d.status === "HALF_DAY_OFF");
    if (statusFilter === "JUSTIFIED") return reportData.days.filter((d) => d.status === "JUSTIFIED");
    return reportData.days;
  }, [reportData, statusFilter]);

  // Selector de opciones de mes para los últimos 12 meses
  const monthOptions = useMemo(() => {
    const list: Array<{ value: string; label: string }> = [];
    const monthsNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const d = new Date();
    for (let i = 0; i < 12; i++) {
      const target = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const val = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
      const label = `${monthsNames[target.getMonth()]} ${target.getFullYear()}`;
      list.push({ value: val, label });
    }
    return list;
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: "92vh" } }}>
      {/* Cabecera del Modal */}
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)",
          color: "#FFFFFF",
          p: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              bgcolor: "rgba(255, 255, 255, 0.15)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 28, color: "#93C5FD" }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.2rem", lineHeight: 1.2 }}>
              Reporte Detallado de Asistencia y Liquidación en Vivo
            </Typography>
            <Typography variant="body2" sx={{ color: "#BFDBFE", fontSize: "0.82rem" }}>
              Cálculo verídico en tiempo real por empleado y rango de fechas (sin requerir calcular planilla)
            </Typography>
          </Box>
        </Box>

        {/* Botones de acción principales */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleExportExcel}
            disabled={!reportData || exportingExcel || loading}
            startIcon={exportingExcel ? <CircularProgress size={18} color="inherit" /> : <TableViewIcon />}
            sx={{
              bgcolor: "#059669",
              "&:hover": { bgcolor: "#047857" },
              fontWeight: 700,
              fontSize: "0.85rem",
              textTransform: "none",
              px: 2,
              py: 0.8,
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.4)",
            }}
          >
            {exportingExcel ? "Generando..." : "Descargar Excel"}
          </Button>

          <Button
            variant="contained"
            onClick={handleExportPdf}
            disabled={!reportData || exportingPdf || loading}
            startIcon={exportingPdf ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
            sx={{
              bgcolor: "#DC2626",
              "&:hover": { bgcolor: "#B91C1C" },
              fontWeight: 700,
              fontSize: "0.85rem",
              textTransform: "none",
              px: 2,
              py: 0.8,
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(220, 38, 38, 0.4)",
            }}
          >
            {exportingPdf ? "Generando..." : "Descargar PDF"}
          </Button>

          <IconButton onClick={onClose} sx={{ color: "rgba(255, 255, 255, 0.8)", "&:hover": { color: "#FFF", bgcolor: "rgba(255,255,255,0.1)" } }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#F8FAFC" }}>
        {/* Barra de Filtros: Empleado y Modalidad de Período */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
          {/* Fila 1: Selección de Colaborador y Modo de Período */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={4.5}>
              <FormControl fullWidth size="small">
                <InputLabel id="emp-select-label" sx={{ fontWeight: 600 }}>Seleccionar Empleado</InputLabel>
                <Select
                  labelId="emp-select-label"
                  value={selectedEmpId}
                  label="Seleccionar Empleado"
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={String(emp.id)}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={emp.employee_code}
                          size="small"
                          sx={{ fontSize: "0.72rem", height: 20, bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}
                        />
                        <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
                          {emp.first_name} {emp.last_name}
                        </Typography>
                        {emp.position && (
                          <Typography sx={{ fontSize: "0.8rem", color: "#64748B" }}>
                            ({emp.position})
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Selector de Modalidad: Ciclo vs Mensual vs Personalizado */}
            <Grid item xs={12} md={7.5}>
              <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                <ToggleButtonGroup
                  value={dateMode}
                  exclusive
                  onChange={(_, val) => handleModeChange(val)}
                  size="small"
                  sx={{
                    bgcolor: "#F1F5F9",
                    p: 0.4,
                    borderRadius: 2.5,
                    border: "1px solid #CBD5E1",
                    "& .MuiToggleButton-root": {
                      border: "none",
                      borderRadius: 2,
                      px: 2,
                      py: 0.7,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      color: "#475569",
                      "&.Mui-selected": {
                        bgcolor: "#1E40AF",
                        color: "#FFFFFF",
                        boxShadow: "0 2px 6px rgba(30, 64, 175, 0.35)",
                        "&:hover": { bgcolor: "#1E3A8A" },
                      },
                    },
                  }}
                >
                  <ToggleButton value="CYCLE">
                    <SyncAltIcon sx={{ fontSize: 18, mr: 0.8 }} />
                    Por Ciclo del Trabajador
                  </ToggleButton>
                  <ToggleButton value="MONTH">
                    <CalendarMonthIcon sx={{ fontSize: 18, mr: 0.8 }} />
                    Reporte Mensual Calendario
                  </ToggleButton>
                  <ToggleButton value="CUSTOM">
                    <DateRangeIcon sx={{ fontSize: 18, mr: 0.8 }} />
                    Personalizado
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1.8 }} />

          {/* Fila 2: Sub-panel dinámico según el modo seleccionado */}
          {dateMode === "CYCLE" ? (
            selectedEmp?.hire_date ? (
              <Box sx={{ bgcolor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 2, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  {/* Selector de Ciclo Calculado */}
                  <Grid item xs={12} sm={6} md={4.5}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="cycle-select-label" sx={{ fontWeight: 600 }}>Ciclo Laboral a Consultar</InputLabel>
                      <Select
                        labelId="cycle-select-label"
                        value={selectedCycleId}
                        label="Ciclo Laboral a Consultar"
                        onChange={(e) => applyCycle(e.target.value)}
                        sx={{ bgcolor: "#FFFFFF", borderRadius: 2 }}
                      >
                        {laborCycles.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography sx={{ fontSize: "0.86rem", fontWeight: c.isCurrent ? 700 : 500 }}>
                                {c.isCurrent ? "🟢 " : "📁 "} {c.label}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Modalidad de Corte de Ciclo */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="cutoff-select-label" sx={{ fontWeight: 600 }}>Criterio de Corte</InputLabel>
                      <Select
                        labelId="cutoff-select-label"
                        value={cutoffMode}
                        label="Criterio de Corte"
                        onChange={(e) => handleCutoffChange(e.target.value as any)}
                        sx={{ bgcolor: "#FFFFFF", borderRadius: 2 }}
                      >
                        <MenuItem value="30_DAYS">
                          30 días exactos (del {String(selectedEmp.hire_date).slice(8, 10)} al día anterior)
                        </MenuItem>
                        <MenuItem value="SAME_DAY">
                          Hasta día de pago (del {String(selectedEmp.hire_date).slice(8, 10)} al {String(selectedEmp.hire_date).slice(8, 10)} inclusive)
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Fechas editables */}
                  <Grid item xs={6} sm={4} md={1.6}>
                    <TextField
                      label="Desde Fecha"
                      type="date"
                      size="small"
                      fullWidth
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ bgcolor: "#FFFFFF", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Grid>

                  <Grid item xs={6} sm={4} md={1.6}>
                    <TextField
                      label="Hasta Fecha"
                      type="date"
                      size="small"
                      fullWidth
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ bgcolor: "#FFFFFF", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Grid>

                  {/* Botón Actualizar */}
                  <Grid item xs={12} sm={4} md={1.3}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={fetchReport}
                      disabled={loading}
                      startIcon={<RefreshIcon />}
                      sx={{
                        bgcolor: "#1E40AF",
                        "&:hover": { bgcolor: "#1E3A8A" },
                        borderRadius: 2,
                        py: 0.9,
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                      }}
                    >
                      Consultar
                    </Button>
                  </Grid>
                </Grid>

                {/* Banner Informativo del Ciclo */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
                  <InfoOutlinedIcon sx={{ fontSize: 18, color: "#15803D" }} />
                  <Typography variant="caption" sx={{ color: "#166534", fontWeight: 600 }}>
                    Período calculado según ingreso: <b>{formatAttendanceDate(selectedEmp.hire_date)}</b> (Día {Number(String(selectedEmp.hire_date).slice(8, 10))} de cada mes). Evaluando <b>{formatAttendanceDate(startDate)}</b> al <b>{formatAttendanceDate(endDate)}</b> ({reportData?.period?.total_calendar_days || 30} días para su pago proyectado).
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Alert
                severity="warning"
                sx={{ borderRadius: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={() => handleModeChange("MONTH")}>
                    Usar Reporte Mensual
                  </Button>
                }
              >
                Este colaborador no tiene fecha de ingreso registrada en su ficha. Para usar el ciclo laboral automático, regístrala en la sección de Empleados, o consulta por <b>Reporte Mensual Calendario</b>.
              </Alert>
            )
          ) : dateMode === "MONTH" ? (
            <Box sx={{ bgcolor: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 2, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                {/* Selector de Mes Calendario */}
                <Grid item xs={12} sm={6} md={5}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="month-select-label" sx={{ fontWeight: 600 }}>Mes Calendario a Consultar</InputLabel>
                    <Select
                      labelId="month-select-label"
                      value={selectedMonth}
                      label="Mes Calendario a Consultar"
                      onChange={(e) => applyMonth(e.target.value)}
                      sx={{ bgcolor: "#FFFFFF", borderRadius: 2 }}
                    >
                      {monthOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          📅 {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={3} md={2.5}>
                  <TextField
                    label="Desde (Inicio de Mes)"
                    type="date"
                    size="small"
                    fullWidth
                    value={startDate}
                    disabled
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: "#FFFFFF", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={6} sm={3} md={2.5}>
                  <TextField
                    label="Hasta (Fin de Mes)"
                    type="date"
                    size="small"
                    fullWidth
                    value={endDate}
                    disabled
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: "#FFFFFF", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={12} md={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={fetchReport}
                    disabled={loading}
                    startIcon={<RefreshIcon />}
                    sx={{
                      bgcolor: "#1E40AF",
                      "&:hover": { bgcolor: "#1E3A8A" },
                      borderRadius: 2,
                      py: 0.9,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                    }}
                  >
                    Consultar Mes
                  </Button>
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
                <InfoOutlinedIcon sx={{ fontSize: 18, color: "#1D4ED8" }} />
                <Typography variant="caption" sx={{ color: "#1E40AF", fontWeight: 600 }}>
                  Reporte mensual estándar: Evaluación exacta del 1 al último día de {monthOptions.find((m) => m.value === selectedMonth)?.label || selectedMonth}.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ bgcolor: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 2, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} sm={4} md={3.5}>
                  <TextField
                    label="Desde Fecha"
                    type="date"
                    size="small"
                    fullWidth
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: "#FFFFFF", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={6} sm={4} md={3.5}>
                  <TextField
                    label="Hasta Fecha"
                    type="date"
                    size="small"
                    fullWidth
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: "#FFFFFF", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4} md={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={fetchReport}
                    disabled={loading}
                    startIcon={<RefreshIcon />}
                    sx={{
                      bgcolor: "#1E40AF",
                      "&:hover": { bgcolor: "#1E3A8A" },
                      borderRadius: 2,
                      py: 0.9,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                    }}
                  >
                    Filtrar Rango
                  </Button>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                    <Chip
                      label="Este Mes"
                      size="small"
                      clickable
                      onClick={() => applyQuickRange("THIS_MONTH")}
                      sx={{ bgcolor: "#FFFFFF", border: "1px solid #CBD5E1", fontWeight: 600 }}
                    />
                    <Chip
                      label="Mes Anterior"
                      size="small"
                      clickable
                      onClick={() => applyQuickRange("LAST_MONTH")}
                      sx={{ bgcolor: "#FFFFFF", border: "1px solid #CBD5E1", fontWeight: 600 }}
                    />
                    <Chip
                      label="15 Días"
                      size="small"
                      clickable
                      onClick={() => applyQuickRange("LAST_15_DAYS")}
                      sx={{ bgcolor: "#FFFFFF", border: "1px solid #CBD5E1", fontWeight: 600 }}
                    />
                    {selectedEmp?.hire_date && (
                      <Chip
                        label="Ciclo Ingreso"
                        size="small"
                        clickable
                        onClick={() => applyQuickRange("HIRE_CYCLE")}
                        sx={{ bgcolor: "#DCFCE7", color: "#166534", fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
            <CircularProgress size={45} thickness={4} sx={{ color: "#2563EB", mb: 2 }} />
            <Typography sx={{ color: "#475569", fontWeight: 600 }}>
              Calculando asistencia y liquidación en tiempo real...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        ) : reportData ? (
          <>
            {/* Ficha Resumen del Colaborador */}
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: "#EFF6FF",
                        color: "#1D4ED8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "1.2rem",
                        border: "2px solid #BFDBFE",
                      }}
                    >
                      {reportData.employee.first_name[0]}
                      {reportData.employee.last_name[0]}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.2, color: "#0F172A" }}>
                        {reportData.employee.full_name}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 0.4, alignItems: "center", flexWrap: "wrap" }}>
                        <Chip
                          label={reportData.employee.employee_code}
                          size="small"
                          sx={{ fontSize: "0.72rem", height: 20, bgcolor: "#E0E7FF", color: "#3730A3", fontWeight: 700 }}
                        />
                        <Typography sx={{ fontSize: "0.82rem", color: "#64748B" }}>
                          DNI: {reportData.employee.document_number || "No registrado"}
                        </Typography>
                        {reportData.employee.hire_date && (
                          <Chip
                            label={`Ingreso: ${formatAttendanceDate(reportData.employee.hire_date)}`}
                            size="small"
                            sx={{ fontSize: "0.72rem", height: 20, bgcolor: "#F1F5F9", color: "#334155", fontWeight: 700 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase" }}>
                    Cargo y Horario
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B", fontSize: "0.92rem" }}>
                    {reportData.employee.position || "Personal Operativo"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>
                    {reportData.employee.schedule_name || "Horario Rotativo"}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, alignItems: "center" }}>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase" }}>
                        Tipo de Contrato
                      </Typography>
                      <Chip
                        label={reportData.employee.contract_type === "CONTRACT" ? "Planilla Mensual (4 descansos)" : "Por Día"}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: reportData.employee.contract_type === "CONTRACT" ? "#EFF6FF" : "#FEF3C7",
                          color: reportData.employee.contract_type === "CONTRACT" ? "#1E40AF" : "#B45309",
                        }}
                      />
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase" }}>
                        Sueldo Diario
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "#059669", fontSize: "1.2rem" }}>
                        S/ {reportData.employee.daily_rate.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.78rem", fontWeight: 700 }}>
                    MODALIDAD DE REPORTE:
                  </Typography>
                  <Chip
                    label={reportData.period.report_type_label || (dateMode === "CYCLE" ? "Por Ciclo Laboral" : "Reporte Mensual")}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: dateMode === "CYCLE" ? "#DCFCE7" : dateMode === "MONTH" ? "#EFF6FF" : "#F1F5F9",
                      color: dateMode === "CYCLE" ? "#166534" : dateMode === "MONTH" ? "#1E40AF" : "#334155",
                      fontSize: "0.75rem",
                    }}
                  />
                  {reportData.period.cycle_description && (
                    <Typography variant="caption" sx={{ color: "#64748B", fontStyle: "italic" }}>
                      ({reportData.period.cycle_description})
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: "#1E293B", fontSize: "0.82rem", fontWeight: 600 }}>
                  Período computado: <b>{formatAttendanceDate(reportData.period.start_date)}</b> al <b>{formatAttendanceDate(reportData.period.end_date)}</b> ({reportData.period.total_calendar_days} días)
                </Typography>
              </Box>
            </Paper>

            {/* Tarjetas KPI de Resumen */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* KPI 1: Días Laborados */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: "1px solid #A7F3D0",
                    bgcolor: "#ECFDF5",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "#065F46", textTransform: "uppercase" }}>
                      Días Laborados
                    </Typography>
                    <CheckCircleOutlineIcon sx={{ color: "#059669", fontSize: 20 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#065F46" }}>
                    {reportData.summary.worked_days}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#047857", fontWeight: 600 }}>
                    {reportData.summary.present_days} asistió + {reportData.summary.late_days} tardanzas
                  </Typography>
                </Paper>
              </Grid>

              {/* KPI 2: Inasistencias (Faltas) */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: "1px solid #FECACA",
                    bgcolor: "#FEF2F2",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "#991B1B", textTransform: "uppercase" }}>
                      Inasistencias
                    </Typography>
                    <EventBusyIcon sx={{ color: "#DC2626", fontSize: 20 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#991B1B" }}>
                    {reportData.summary.absent_days}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#B91C1C", fontWeight: 600 }}>
                    {reportData.summary.absent_days === 0 ? "Sin inasistencias" : `${reportData.summary.absent_days} días sin asistir`}
                  </Typography>
                </Paper>
              </Grid>

              {/* KPI 3: Tardanzas y Descuento */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: "1px solid #FDE68A",
                    bgcolor: "#FFFBEB",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "#92400E", textTransform: "uppercase" }}>
                      Tardanzas
                    </Typography>
                    <WarningAmberIcon sx={{ color: "#D97706", fontSize: 20 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#92400E" }}>
                    {reportData.summary.total_late_hours_formatted || `${reportData.summary.total_late_minutes}m`}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#B45309", fontWeight: 700 }}>
                    Desc: S/ {reportData.summary.lateness_deduction.toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>

              {/* KPI 4: Días de Descanso */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: "1px solid #DDD6FE",
                    bgcolor: "#F5F3FF",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "#5B21B6", textTransform: "uppercase" }}>
                      Descansos
                    </Typography>
                    <BeachAccessIcon sx={{ color: "#7C3AED", fontSize: 20 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#5B21B6" }}>
                    {reportData.summary.day_off_days}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#6D28D9", fontWeight: 600 }}>
                    Pagados: {reportData.summary.day_7_paid_days} (S/ {reportData.summary.day_7_amount.toFixed(2)})
                  </Typography>
                </Paper>
              </Grid>

              {/* KPI 5: TOTAL NETO A PAGAR VERÍDICO */}
              <Grid item xs={12} sm={12} md={2.4}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: "2px solid #059669",
                    background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.15)",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "#065F46", textTransform: "uppercase" }}>
                      Total Neto a Pagar
                    </Typography>
                    <AttachMoneyIcon sx={{ color: "#059669", fontSize: 22 }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: "#047857" }}>
                    S/ {reportData.summary.net_total_pay.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#065F46", fontWeight: 700 }}>
                    Data verídica en tiempo real
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Pestañas: Detalle Día a Día vs Liquidación */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)}>
                <Tab
                  label={`Detalle Día por Día (${reportData.days.length} días)`}
                  sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.92rem" }}
                />
                <Tab
                  label="Desglose Financiero y Liquidación"
                  sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.92rem" }}
                />
                {reportData.advances.length > 0 && (
                  <Tab
                    label={`Adelantos de Sueldo (${reportData.advances.length})`}
                    sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.92rem" }}
                  />
                )}
              </Tabs>
            </Box>

            {/* TAB 0: DETALLE DÍA A DÍA */}
            {activeTab === 0 && (
              <Box>
                {/* Filtro rápido de estado */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FilterListIcon sx={{ color: "#64748B", fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: "#475569", fontWeight: 600 }}>
                      Filtrar días:
                    </Typography>
                    {[
                      { key: "ALL", label: `Todos (${reportData.days.length})` },
                      { key: "PRESENT", label: `Asistió (${reportData.summary.present_days})` },
                      { key: "LATE", label: `Tardanzas (${reportData.summary.late_days})` },
                      { key: "ABSENT", label: `Faltas (${reportData.summary.absent_days})` },
                      { key: "DAY_OFF", label: `Descansos (${reportData.summary.day_off_days})` },
                    ].map((f) => (
                      <Chip
                        key={f.key}
                        label={f.label}
                        size="small"
                        clickable
                        onClick={() => setStatusFilter(f.key)}
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          bgcolor: statusFilter === f.key ? "#1E3A8A" : "#FFFFFF",
                          color: statusFilter === f.key ? "#FFFFFF" : "#475569",
                          border: statusFilter === f.key ? "none" : "1px solid #CBD5E1",
                        }}
                      />
                    ))}
                  </Box>

                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>
                    Mostrando {filteredDays.length} de {reportData.days.length} días del período
                  </Typography>
                </Box>

                {/* Tabla Detallada Día a Día */}
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #E2E8F0" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#1E3A8A" }}>
                      <TableRow>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2, textAlign: "center" }}>N°</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>Fecha</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>Día</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2, textAlign: "center" }}>Horario</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2, textAlign: "center" }}>Entrada</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2, textAlign: "center" }}>Salida</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>Condición / Estado</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2, textAlign: "center" }}>Horas Trab.</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2, textAlign: "center" }}>Tardanza</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2, textAlign: "right" }}>Desc. Tard.</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2, textAlign: "center" }}>H. Extras</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2, textAlign: "right" }}>Bonif. H.E.</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2, textAlign: "right" }}>Pago Día</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>Observaciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDays.map((d, index) => {
                        const isEven = index % 2 === 0;
                        return (
                          <TableRow
                            key={d.date}
                            hover
                            sx={{
                              bgcolor: isEven ? "#FFFFFF" : "#F8FAFC",
                              "&:hover": { bgcolor: "#F1F5F9" },
                            }}
                          >
                            <TableCell sx={{ textAlign: "center", fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>
                              {d.index}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#1E293B" }}>
                              {d.date}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.82rem", color: d.is_sunday ? "#DC2626" : "#334155", fontWeight: d.is_sunday ? 700 : 500 }}>
                              {d.day_name}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center", fontSize: "0.78rem", color: "#475569" }}>
                              {d.schedule_text}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center", fontSize: "0.82rem", fontWeight: 700, color: "#0F172A" }}>
                              {d.entry_time}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center", fontSize: "0.82rem", fontWeight: 700, color: "#0F172A" }}>
                              {d.exit_time}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={d.status_label}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.73rem",
                                  bgcolor:
                                    d.status === "PRESENT"
                                      ? "#DCFCE7"
                                      : d.status === "LATE"
                                      ? "#FEF3C7"
                                      : d.status === "ABSENT"
                                      ? "#FEE2E2"
                                      : d.status === "DAY_OFF" || d.status === "HALF_DAY_OFF"
                                      ? "#E0E7FF"
                                      : d.status === "JUSTIFIED"
                                      ? "#F3E8FF"
                                      : "#F1F5F9",
                                  color:
                                    d.status === "PRESENT"
                                      ? "#166534"
                                      : d.status === "LATE"
                                      ? "#B45309"
                                      : d.status === "ABSENT"
                                      ? "#991B1B"
                                      : d.status === "DAY_OFF" || d.status === "HALF_DAY_OFF"
                                      ? "#3730A3"
                                      : d.status === "JUSTIFIED"
                                      ? "#6B21A8"
                                      : "#475569",
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                              {d.worked_hours_formatted}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center", fontSize: "0.8rem", color: d.late_minutes > 0 ? "#D97706" : "#64748B", fontWeight: d.late_minutes > 0 ? 700 : 400 }}>
                              {d.late_minutes > 0 ? `${d.late_minutes} min` : "-"}
                            </TableCell>
                            <TableCell sx={{ textAlign: "right", fontSize: "0.8rem", color: d.lateness_deduction > 0 ? "#DC2626" : "#64748B", fontWeight: d.lateness_deduction > 0 ? 700 : 400 }}>
                              {d.lateness_deduction > 0 ? `- S/ ${d.lateness_deduction.toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center", fontSize: "0.8rem", color: d.overtime_minutes > 0 ? "#2563EB" : "#64748B", fontWeight: d.overtime_minutes > 0 ? 700 : 400 }}>
                              {d.overtime_minutes > 0 ? d.overtime_hours_formatted : "-"}
                            </TableCell>
                            <TableCell sx={{ textAlign: "right", fontSize: "0.8rem", color: d.overtime_bonus > 0 ? "#059669" : "#64748B", fontWeight: d.overtime_bonus > 0 ? 700 : 400 }}>
                              {d.overtime_bonus > 0 ? `+ S/ ${d.overtime_bonus.toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell sx={{ textAlign: "right", fontSize: "0.85rem", fontWeight: 800, color: d.day_total_pay > 0 ? "#047857" : "#64748B" }}>
                              {d.day_total_pay > 0 ? `S/ ${d.day_total_pay.toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.78rem", color: "#64748B" }}>
                              {d.notes || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* TAB 1: DESGLOSE FINANCIERO Y LIQUIDACIÓN */}
            {activeTab === 1 && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={7}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: "#1E3A8A", fontSize: "1.05rem" }}>
                        Desglose Proyectado de Liquidación del Período
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "#1E293B" }}>
                              (+) Sueldo Base por Días Laborados
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748B" }}>
                              {reportData.summary.worked_days} días laborados × S/ {reportData.summary.daily_rate.toFixed(2)} diario
                            </Typography>
                          </Box>
                          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#0F172A" }}>
                            S/ {reportData.summary.base_amount.toFixed(2)}
                          </Typography>
                        </Box>

                        <Divider />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "#1E293B" }}>
                              (+) Remuneración por Días de Descanso (Día 7)
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748B" }}>
                              {reportData.summary.day_7_paid_days} descansos remunerados (cuota mensual hasta 4 días)
                            </Typography>
                          </Box>
                          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#2563EB" }}>
                            + S/ {reportData.summary.day_7_amount.toFixed(2)}
                          </Typography>
                        </Box>

                        <Divider />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "#1E293B" }}>
                              (+) Bonificación por Horas Extras
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748B" }}>
                              {reportData.summary.total_overtime_hours_formatted} a S/ {reportData.employee.overtime_hourly_rate.toFixed(2)} por hora
                            </Typography>
                          </Box>
                          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#059669" }}>
                            + S/ {reportData.summary.overtime_bonus.toFixed(2)}
                          </Typography>
                        </Box>

                        <Divider />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "#DC2626" }}>
                              (-) Descuento por Minutos de Tardanza
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748B" }}>
                              {reportData.summary.total_late_minutes} minutos descontados calculados al minuto exacto
                            </Typography>
                          </Box>
                          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#DC2626" }}>
                            - S/ {reportData.summary.lateness_deduction.toFixed(2)}
                          </Typography>
                        </Box>

                        <Divider />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "#DC2626" }}>
                              (-) Deducción por Adelantos de Sueldo
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748B" }}>
                              {reportData.advances.length} adelanto(s) aprobados para este período
                            </Typography>
                          </Box>
                          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#DC2626" }}>
                            - S/ {reportData.summary.advance_deduction.toFixed(2)}
                          </Typography>
                        </Box>

                        {/* Caja Total Neto Destacada */}
                        <Paper
                          elevation={0}
                          sx={{
                            mt: 2,
                            p: 2.5,
                            borderRadius: 2,
                            bgcolor: "#ECFDF5",
                            border: "2px solid #059669",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#065F46" }}>
                              TOTAL NETO A PAGAR PROYECTADO
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#047857", fontWeight: 600 }}>
                              Data verídica calculada al vuelo en tiempo real
                            </Typography>
                          </Box>
                          <Typography sx={{ fontWeight: 900, fontSize: "1.6rem", color: "#047857" }}>
                            S/ {reportData.summary.net_total_pay.toFixed(2)}
                          </Typography>
                        </Paper>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: "#1E3A8A", fontSize: "1rem" }}>
                        Reglas de Negocio Aplicadas
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.85rem" }}>
                          • <strong>Días de Descanso Rotativo:</strong> Tienen 4 días de descanso al mes. Se permite fraccionar en medios días (0.5 días).
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.85rem" }}>
                          • <strong>Día 7 Remunerado:</strong> En trabajadores bajo modalidad de Contrato, los días de descanso tomados son remunerados (hasta un máximo de 4.0 días al mes).
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.85rem" }}>
                          • <strong>Tardanzas:</strong> Descuento al minuto según la tasa del sueldo diario (base 8 horas = 480 min).
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.85rem" }}>
                          • <strong>Adelantos:</strong> Se descuentan directamente los adelantos aprobados del trabajador.
                        </Typography>
                      </Box>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: "#1E3A8A", fontSize: "1rem" }}>
                        Exportaciones Disponibles
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.85rem", mb: 2 }}>
                        Descargue el reporte completo con formato corporativo profesional:
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleExportExcel}
                          disabled={exportingExcel}
                          startIcon={<TableViewIcon />}
                          sx={{
                            bgcolor: "#059669",
                            "&:hover": { bgcolor: "#047857" },
                            fontWeight: 700,
                            py: 1.2,
                            borderRadius: 2,
                            textTransform: "none",
                          }}
                        >
                          {exportingExcel ? "Generando..." : "Descargar en Excel (.xlsx)"}
                        </Button>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleExportPdf}
                          disabled={exportingPdf}
                          startIcon={<PictureAsPdfIcon />}
                          sx={{
                            bgcolor: "#DC2626",
                            "&:hover": { bgcolor: "#B91C1C" },
                            fontWeight: 700,
                            py: 1.2,
                            borderRadius: 2,
                            textTransform: "none",
                          }}
                        >
                          {exportingPdf ? "Generando..." : "Descargar en PDF (.pdf)"}
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* TAB 2: ADELANTOS DE SUELDO */}
            {activeTab === 2 && reportData.advances.length > 0 && (
              <Box>
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #E2E8F0" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#1E3A8A" }}>
                      <TableRow>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700 }}>N°</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700 }}>Fecha Solicitud</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700, textAlign: "right" }}>Monto Adelantado</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700 }}>Estado</TableCell>
                        <TableCell sx={{ color: "#FFF", fontWeight: 700 }}>Motivo / Justificación</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.advances.map((adv, idx) => (
                        <TableRow key={adv.id} hover>
                          <TableCell sx={{ fontWeight: 600, color: "#64748B" }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{adv.date}</TableCell>
                          <TableCell sx={{ textAlign: "right", fontWeight: 800, color: "#DC2626" }}>
                            S/ {adv.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={adv.status === "APPROVED" ? "Aprobado" : adv.status === "PAID" ? "Pagado" : adv.status}
                              size="small"
                              sx={{ bgcolor: "#DCFCE7", color: "#166534", fontWeight: 700, fontSize: "0.75rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: "#475569" }}>{adv.reason || "Sin motivo especificado"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, borderTop: "1px solid #E2E8F0", bgcolor: "#FFFFFF", justifyContent: "space-between" }}>
        <Typography variant="caption" sx={{ color: "#64748B" }}>
          Sistema de Control de Asistencia • Generado de datos verídicos en vivo
        </Typography>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 700,
            textTransform: "none",
            borderColor: "#CBD5E1",
            color: "#334155",
            "&:hover": { borderColor: "#94A3B8", bgcolor: "#F1F5F9" },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
