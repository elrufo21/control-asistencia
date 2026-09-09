import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  FormControl,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { ColumnDef } from "@tanstack/react-table";
import { apiFetch } from "../services/api";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/DataTable";
import { StatusChip } from "../components/StatusChip";

function parseWorkDays(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.flatMap(parseWorkDays);
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[\{\}\"\'\s]/g, "");
    if (!cleaned) return [];
    return cleaned.split(",").filter(Boolean);
  }
  return [];
}

function formatDateDMY(rawDate: any): string {
  if (!rawDate) return "-";
  const str = String(rawDate).slice(0, 10);
  const [yStr, mStr, dStr] = str.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return str;
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const monthName = months[m - 1] || mStr;
  return `${String(d).padStart(2, "0")}/${monthName}/${y}`;
}

const ALL_DAYS = [
  { key: "MONDAY", label: "Lun" },
  { key: "TUESDAY", label: "Mar" },
  { key: "WEDNESDAY", label: "Mié" },
  { key: "THURSDAY", label: "Jue" },
  { key: "FRIDAY", label: "Vie" },
  { key: "SATURDAY", label: "Sáb" },
  { key: "SUNDAY", label: "Dom" },
];

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Detail Dialog State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [empDailyList, setEmpDailyList] = useState<any[]>([]);
  const [empDayOffStats, setEmpDayOffStats] = useState<any>(null);
  const [detailTab, setDetailTab] = useState(0);

  // Modal de Asignar Descanso a Trabajador
  const [showRestModal, setShowRestModal] = useState(false);
  const [restDate, setRestDate] = useState(new Date().toISOString().slice(0, 10));
  const [restSlot, setRestSlot] = useState("FULL");
  const [restNotes, setRestNotes] = useState("");
  const [savingRest, setSavingRest] = useState(false);

  const openRestDialog = () => {
    setRestDate(new Date().toISOString().slice(0, 10));
    setRestSlot("FULL");
    setRestNotes("");
    setShowRestModal(true);
  };

  const handleSaveRest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSavingRest(true);
    try {
      await apiFetch("/attendance/register-day-off", {
        method: "POST",
        body: JSON.stringify({
          employee_id: selectedEmp.id,
          date: restDate,
          fraction: restSlot === "FULL" ? 1.0 : 0.5,
          time_slot: restSlot,
          notes: restNotes || "Registrado desde Ficha de Empleado",
        }),
      });
      setShowRestModal(false);
      const [history, stats] = await Promise.all([
        apiFetch(`/attendance/daily?employee_id=${selectedEmp.id}`).catch(() => []),
        apiFetch(`/attendance/day-off-balance/${selectedEmp.id}`).catch(() => null),
      ]);
      setEmpDailyList(history || []);
      setEmpDayOffStats(stats);
      loadData();
    } catch (err: any) {
      alert(err.message || "Error al registrar descanso");
    } finally {
      setSavingRest(false);
    }
  };

  // Form State
  const [documentNumber, setDocumentNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [hireDate, setHireDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailyRate, setDailyRate] = useState("50.00");
  const [otRate, setOtRate] = useState("8.00");
  const [contractType, setContractType] = useState("CONTRACT");
  const [allowHalfDayOff, setAllowHalfDayOff] = useState<boolean>(false);
  const [workDays, setWorkDays] = useState<string[]>(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]);
  const [scheduleId, setScheduleId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await apiFetch("/employees");
      setEmployees(data.items || []);

      const scheds = await apiFetch("/schedules");
      setSchedules(scheds || []);
      if (scheds.length && !scheduleId) setScheduleId(String(scheds[0].id));
    } catch (e) {
      console.error(e);
    }
  }

  const openCreateModal = () => {
    setEditId(null);
    setDocumentNumber("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setPosition("");
    setHireDate(new Date().toISOString().slice(0, 10));
    setDailyRate("50.00");
    setOtRate("8.00");
    setContractType("CONTRACT");
    setAllowHalfDayOff(false);
    setWorkDays(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]);
    setScheduleId(schedules.length ? String(schedules[0].id) : "");
    setShowModal(true);
  };

  const openEditModal = (emp: any) => {
    setEditId(emp.id);
    setDocumentNumber(emp.document_number || "");
    setFirstName(emp.first_name || "");
    setLastName(emp.last_name || "");
    setPhone(emp.phone || "");
    setPosition(emp.position || "");
    setHireDate(emp.hire_date ? emp.hire_date.slice(0, 10) : "");
    setDailyRate(String(emp.daily_rate || 50));
    setOtRate(String(emp.overtime_hourly_rate || 8));
    setContractType(emp.contract_type || "CONTRACT");
    setAllowHalfDayOff(Boolean(emp.allow_half_day_off));
    setWorkDays(parseWorkDays(emp.work_days));
    setScheduleId(emp.schedule_id ? String(emp.schedule_id) : (schedules.length ? String(schedules[0].id) : ""));
    setShowModal(true);
  };

  const openDetailModal = async (emp: any) => {
    setSelectedEmp(emp);
    setDetailTab(0);
    setEmpDayOffStats(null);
    setShowDetailModal(true);
    try {
      const [history, stats] = await Promise.all([
        apiFetch(`/attendance/daily?employee_id=${emp.id}`).catch(() => []),
        apiFetch(`/attendance/day-off-balance/${emp.id}`).catch(() => null),
      ]);
      setEmpDailyList(history || []);
      setEmpDayOffStats(stats);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDayToggle = (day: string) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        document_number: documentNumber,
        first_name: firstName,
        last_name: lastName,
        phone,
        position,
        hire_date: hireDate,
        daily_rate: Number(dailyRate),
        overtime_hourly_rate: Number(otRate),
        contract_type: contractType,
        allow_half_day_off: allowHalfDayOff,
        work_days: workDays,
        schedule_id: scheduleId ? Number(scheduleId) : undefined,
      };

      if (editId) {
        await apiFetch(`/employees/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/employees", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Error al guardar");
    }
  };

  // TanStack Table columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "employee_code",
      header: "Código",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "primary.main" }}>
          {String(info.getValue())}
        </Typography>
      ),
    },
    {
      accessorKey: "first_name",
      header: "Trabajador",
      cell: (info) => {
        const row = info.row.original;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {row.first_name} {row.last_name}
            </Typography>
            {row.position && (
              <Typography variant="caption" color="text.secondary">
                {row.position}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      accessorKey: "document_number",
      header: "DNI / Documento",
      cell: (info) => <Typography variant="body2">{String(info.getValue())}</Typography>,
    },
    {
      accessorKey: "contract_type",
      header: "Tipo Contrato",
      cell: (info) => <StatusChip status={String(info.getValue())} />,
    },
    {
      accessorKey: "allow_half_day_off",
      header: "Medio Día",
      cell: (info) => (
        <Chip
          size="small"
          label={info.getValue() ? "0.5d Habilitado" : "Solo 1.0d"}
          color={info.getValue() ? "info" : "default"}
          variant={info.getValue() ? "filled" : "outlined"}
          sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700 }}
        />
      ),
    },
    {
      accessorKey: "daily_rate",
      header: "Tarifa Diaria",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          S/ {Number(info.getValue()).toFixed(2)}
        </Typography>
      ),
    },
    {
      accessorKey: "contract_type",
      header: "Régimen & Descansos",
      cell: (info) => {
        const type = info.getValue();
        const allowHalf = info.row.original.allow_half_day_off;
        if (type === "CONTRACT") {
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
              <Chip
                label="Rotativo (4 d/mes)"
                size="small"
                color="primary"
                variant="filled"
                sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, width: "fit-content" }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                {allowHalf ? "Permite medios días (0.5d)" : "Solo días completos (1.0d)"}
              </Typography>
            </Box>
          );
        }
        return (
          <Chip
            label="Por Día Laborado"
            size="small"
            variant="outlined"
            sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, width: "fit-content" }}
          />
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: (info) => {
        const emp = info.row.original;
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              color="info"
              startIcon={<VisibilityIcon />}
              onClick={() => openDetailModal(emp)}
            >
              Ver Detalle
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => openEditModal(emp)}
            >
              Editar
            </Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Gestión de Trabajadores"
        subtitle="Administra el personal, tipos de contrato, tarifas económicas y días de trabajo."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal} sx={{ py: 1.2, px: 3 }}>
            Nuevo Trabajador
          </Button>
        }
      />

      <DataTable columns={columns} data={employees} searchPlaceholder="Buscar por código, DNI o nombre..." />

      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmp && (
        <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
            Detalle del Empleado & Historial
            <IconButton onClick={() => setShowDetailModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <Box sx={{ px: 3, pt: 1, borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={detailTab} onChange={(_, val) => setDetailTab(val)}>
              <Tab label="1. Información & Horario" sx={{ fontWeight: 700 }} />
              <Tab label="2. Historial de Asistencia Diario" sx={{ fontWeight: 700 }} />
            </Tabs>
          </Box>

          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5, minHeight: 350 }}>
            <Box sx={{ bgcolor: "#f8fafc", p: 2, borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {selectedEmp.first_name} {selectedEmp.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Código: {selectedEmp.employee_code} · DNI: {selectedEmp.document_number} · Cargo: {selectedEmp.position || "Operativo"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Contrato: {selectedEmp.contract_type === "CONTRACT" ? "Por Contrata (4 Descansos Mensuales)" : "Por Días"} · Tarifa: S/ {Number(selectedEmp.daily_rate).toFixed(2)}/día
              </Typography>
            </Box>

            {detailTab === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <BeachAccessIcon color="info" /> Ciclo Mensual & Descansos Rotativos (4 al Mes)
                  </Typography>
                  <Grid container spacing={2}>
                    {(() => {
                      const used = Number(empDayOffStats?.usedDaysOff ?? empDayOffStats?.used_days_off ?? 0);
                      const max = Number(empDayOffStats?.maxDaysOff ?? empDayOffStats?.max_days_off ?? 4);
                      const rem = Number(empDayOffStats?.remainingDaysOff ?? empDayOffStats?.remaining_days_off ?? Math.max(0, max - used));
                      const cycleDays = empDayOffStats?.cycle?.cycleDays || empDayOffStats?.cycle?.daysInCycle || 30;
                      const startStr = empDayOffStats?.cycle?.startDate ? formatDateDMY(empDayOffStats.cycle.startDate) : "";
                      const endStr = empDayOffStats?.cycle?.endDate ? formatDateDMY(empDayOffStats.cycle.endDate) : "";

                      return (
                        <>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              Ciclo Activo ({cycleDays} días en el mes):
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                              {startStr && endStr ? `${startStr} al ${endStr}` : "Calculando..."}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Anclado a fecha de ingreso ({selectedEmp.hire_date ? formatDateDMY(selectedEmp.hire_date) : "No registrada"})
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              Saldo de Descansos en el Ciclo:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: used > max ? "error.main" : "success.main" }}>
                              {empDayOffStats ? `${used} de ${max} días tomados` : "—"}
                              {used > max && " (⚠️ Exceso)"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Restan: <strong>{empDayOffStats ? `${rem} días` : "—"}</strong> · Medios días:{" "}
                              <Chip
                                size="small"
                                label={selectedEmp.allow_half_day_off ? "Habilitado (0.5d)" : "No habilitado"}
                                color={selectedEmp.allow_half_day_off ? "success" : "default"}
                                sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, ml: 0.5 }}
                              />
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sx={{ pt: 1, display: "flex", justifyContent: "flex-end" }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              startIcon={<BeachAccessIcon />}
                              onClick={openRestDialog}
                              sx={{ fontWeight: 700 }}
                            >
                              + Asignar Descanso a este Trabajador
                            </Button>
                          </Grid>
                        </>
                      );
                    })()}
                  </Grid>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <AccessTimeIcon color="secondary" /> Horario Vigente
                  </Typography>
                  {(() => {
                    const activeSchedule = schedules.find((s) => Number(s.id) === Number(selectedEmp.schedule_id));
                    const name = activeSchedule ? activeSchedule.name : (selectedEmp.schedule_name || "Sin horario asignado");
                    const desc = activeSchedule?.description;
                    const shifts = activeSchedule?.shifts || [];
                    return (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
                          {name} {desc ? `(${desc})` : ""}
                        </Typography>
                        {shifts.length > 0 && (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
                            {shifts.map((sh: any, idx: number) => (
                              <Typography key={idx} variant="caption" color="text.secondary">
                                • {sh.name || `Turno ${idx + 1}`}: {sh.start_time?.slice(0, 5)} - {sh.end_time?.slice(0, 5)}
                                {sh.break_start_time ? ` (Refrigerio: ${sh.break_start_time?.slice(0, 5)} - ${sh.break_end_time?.slice(0, 5)})` : ""}
                                {sh.check_in_tolerance_min ? ` · Tol. Entrada: ${sh.check_in_tolerance_min} min` : ""}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    );
                  })()}
                </Paper>
              </Box>
            )}

            {detailTab === 1 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>
                  Historial Reciente de Asistencias ({empDailyList.length} registros)
                </Typography>

                <Grid container spacing={1.5}>
                  {empDailyList.map((r: any) => {
                    const dateStr = formatDateDMY(r.operational_date);
                    return (
                      <Grid item xs={6} sm={4} md={3} key={r.id}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: r.status === "PRESENT" ? "#f0fdf4" : r.status === "LATE" ? "#fffbeb" : r.status === "JUSTIFIED" ? "#eff6ff" : r.status === "ABSENT" ? "#fef2f2" : "#f8fafc",
                            borderColor: r.status === "PRESENT" ? "#bbf7d0" : r.status === "LATE" ? "#fde68a" : r.status === "JUSTIFIED" ? "#bfdbfe" : r.status === "ABSENT" ? "#fecaca" : "#e2e8f0",
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: "monospace" }}>
                              {dateStr}
                            </Typography>
                            <StatusChip status={r.status} />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Trabajado: {Math.floor(r.worked_minutes / 60)}h {r.worked_minutes % 60}m
                          </Typography>
                          {r.late_minutes > 0 && (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "warning.main", display: "block" }}>
                              ⚠️ Tardanza: {r.late_minutes} min
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowDetailModal(false)} variant="contained" sx={{ px: 4 }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* MUI Create/Edit Modal Form */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
          {editId ? "Editar Trabajador" : "Nuevo Trabajador"}
          <IconButton onClick={() => setShowModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* 1. Datos Personales */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <PersonIcon fontSize="small" /> 1. Datos Personales
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="DNI / Documento"
                    fullWidth
                    required
                    disabled={!!editId}
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Teléfono / Móvil"
                    fullWidth
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombres"
                    fullWidth
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Apellidos"
                    fullWidth
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Cargo / Puesto"
                    fullWidth
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* 2. Régimen Laboral & Ciclo */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <WorkIcon fontSize="small" /> 2. Régimen Laboral & Ciclo de Pago
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Tipo de Contrato"
                    fullWidth
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                  >
                    <MenuItem value="CONTRACT">Por Contrata (4 Descansos/Mes)</MenuItem>
                    <MenuItem value="PER_DAY">Por Días Laborados</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Fecha de Ingreso (Ancla del Ciclo)"
                    type="date"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    helperText="Define el inicio de ciclo mensual del trabajador (ej: día 8)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Horario Asignado"
                    fullWidth
                    value={scheduleId}
                    onChange={(e) => setScheduleId(e.target.value)}
                  >
                    {schedules.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Paper>

            {/* 3. Tarifas & Permisos */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <AttachMoneyIcon fontSize="small" /> 3. Tarifas & Política de Descansos
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tarifa Diaria (S/)"
                    type="number"
                    fullWidth
                    required
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tarifa Hora Extra (S/)"
                    type="number"
                    fullWidth
                    required
                    value={otRate}
                    onChange={(e) => setOtRate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f8fafc" }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={allowHalfDayOff}
                          onChange={(e) => setAllowHalfDayOff(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Permitir Descansos de Medio Día (0.5 días)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Habilita la opción de descansos fraccionados en el kiosco. Dos medios días equivalen a un día completo (máximo 4 días al mes).
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ px: 3 }}>
              {editId ? "Guardar Cambios" : "Crear Trabajador"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal Asignar Descanso a este Trabajador */}
      {selectedEmp && (
        <Dialog open={showRestModal} onClose={() => setShowRestModal(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, color: "primary.main" }}>
            🏖️ Asignar Descanso
            <IconButton onClick={() => setShowRestModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <form onSubmit={handleSaveRest}>
            <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {selectedEmp.first_name} {selectedEmp.last_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Código: {selectedEmp.employee_code} · Medios días: {selectedEmp.allow_half_day_off ? "Permitido" : "No permitido"}
                </Typography>
              </Box>

              <TextField
                label="Fecha del Descanso"
                type="date"
                fullWidth
                required
                value={restDate}
                onChange={(e) => setRestDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <FormControl component="fieldset">
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", mb: 1 }}>
                  Modalidad de Descanso
                </Typography>
                <RadioGroup
                  value={restSlot}
                  onChange={(e) => setRestSlot(e.target.value)}
                >
                  <FormControlLabel value="FULL" control={<Radio />} label="Día Completo (1.0 día)" />
                  <FormControlLabel
                    value="MORNING"
                    disabled={!selectedEmp.allow_half_day_off}
                    control={<Radio />}
                    label="Medio Día — Turno Mañana (0.5 día)"
                  />
                  <FormControlLabel
                    value="AFTERNOON"
                    disabled={!selectedEmp.allow_half_day_off}
                    control={<Radio />}
                    label="Medio Día — Turno Tarde (0.5 día)"
                  />
                </RadioGroup>
              </FormControl>

              <TextField
                label="Notas / Motivo"
                fullWidth
                placeholder="ej. Solicitud directa / coordinado con jefe"
                value={restNotes}
                onChange={(e) => setRestNotes(e.target.value)}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setShowRestModal(false)} color="inherit">
                Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={savingRest} sx={{ fontWeight: 700 }}>
                {savingRest ? "Guardando..." : "Confirmar Descanso"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Box>
  );
};
