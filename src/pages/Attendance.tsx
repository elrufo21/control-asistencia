import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  RadioGroup,
  Radio,
  FormControlLabel,
  Paper,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import { ColumnDef } from "@tanstack/react-table";
import { apiFetch } from "../services/api";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/DataTable";
import { StatusChip } from "../components/StatusChip";

/**
 * Formatea una fecha a DD/Mes/AAAA (ej. 08/Sep/2026 o 01/Ago/2026)
 */
export function formatAttendanceDate(rawDate: any): string {
  if (!rawDate) return "-";
  const str = String(rawDate).slice(0, 10);
  const [yStr, mStr, dStr] = str.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return str;

  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const monthName = months[m - 1] || mStr;
  const dayStr = String(d).padStart(2, "0");

  return `${dayStr}/${monthName}/${y}`;
}

export const Attendance: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dailyList, setDailyList] = useState<any[]>([]);
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [showJustModal, setShowJustModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [justReason, setJustReason] = useState("");
  const [justType, setJustType] = useState("LATENESS");
  const [targetDayOffDate, setTargetDayOffDate] = useState("");
  const [exchangeMode, setExchangeMode] = useState<"FULL" | "TWO_HALF_DAYS" | "HALF">("FULL");
  const [targetHalfDay1, setTargetHalfDay1] = useState("");
  const [targetSlot1, setTargetSlot1] = useState("MORNING");
  const [targetHalfDay2, setTargetHalfDay2] = useState("");
  const [targetSlot2, setTargetSlot2] = useState("AFTERNOON");

  // Quick Filter State
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Asignar Descanso Modal State
  const [showDayOffModal, setShowDayOffModal] = useState(false);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [dayOffEmpId, setDayOffEmpId] = useState<string>("");
  const [dayOffDate, setDayOffDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dayOffFraction, setDayOffFraction] = useState<number>(1.0);
  const [dayOffSlot, setDayOffSlot] = useState<string>("FULL");
  const [dayOffNotes, setDayOffNotes] = useState<string>("");
  const [submittingDayOff, setSubmittingDayOff] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    try {
      if (activeTab === 0) {
        const data = await apiFetch("/attendance/daily");
        setDailyList(data || []);
      } else {
        const data = await apiFetch("/attendance/sessions");
        setSessionsList(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const openAssignDayOffModal = async (empId?: number | string) => {
    try {
      const data = await apiFetch("/employees?status=ACTIVE");
      const list = data.items || [];
      setActiveEmployees(list);
      if (empId) {
        setDayOffEmpId(String(empId));
      } else if (list.length > 0) {
        setDayOffEmpId(String(list[0].id));
      }
      setDayOffDate(new Date().toISOString().slice(0, 10));
      setDayOffFraction(1.0);
      setDayOffSlot("FULL");
      setDayOffNotes("");
      setShowDayOffModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDayOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayOffEmpId) return;
    setSubmittingDayOff(true);
    try {
      await apiFetch("/attendance/register-day-off", {
        method: "POST",
        body: JSON.stringify({
          employee_id: Number(dayOffEmpId),
          date: dayOffDate,
          fraction: dayOffFraction,
          time_slot: dayOffSlot,
          notes: dayOffNotes || "Asignado desde Panel Web",
        }),
      });
      setShowDayOffModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Error al asignar descanso");
    } finally {
      setSubmittingDayOff(false);
    }
  };

  const openJustification = (rec: any) => {
    setSelectedRecord(rec);
    setJustReason("");
    setJustType(rec.status === "ABSENT" ? "DAY_OFF_EXCHANGE" : "LATENESS");
    setExchangeMode("FULL");
    setTargetDayOffDate("");
    setTargetHalfDay1("");
    setTargetHalfDay2("");
    setTargetSlot1("MORNING");
    setTargetSlot2("AFTERNOON");
    setShowJustModal(true);
  };

  const handleJustifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await apiFetch("/attendance/justifications", {
        method: "POST",
        body: JSON.stringify({
          employee_id: selectedRecord.employee_id,
          operational_date: selectedRecord.operational_date,
          justification_type: justType,
          reason: justReason,
          exchange_mode: justType === "DAY_OFF_EXCHANGE" ? exchangeMode : undefined,
          target_day_off_date:
            justType === "DAY_OFF_EXCHANGE"
              ? exchangeMode === "TWO_HALF_DAYS"
                ? undefined
                : targetDayOffDate
              : undefined,
          target_half_day_date_1:
            justType === "DAY_OFF_EXCHANGE" && exchangeMode === "TWO_HALF_DAYS"
              ? targetHalfDay1
              : undefined,
          target_half_day_date_2:
            justType === "DAY_OFF_EXCHANGE" && exchangeMode === "TWO_HALF_DAYS"
              ? targetHalfDay2
              : undefined,
          slot_1: targetSlot1,
          slot_2: targetSlot2,
        }),
      });
      setShowJustModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Error al justificar");
    }
  };

  // Filtered daily list and dynamic counts
  const filteredDailyList = useMemo(() => {
    if (statusFilter === "ALL") return dailyList;
    if (statusFilter === "DAY_OFF") {
      return dailyList.filter(
        (r) => r.status === "DAY_OFF" || r.status === "HALF_DAY_OFF" || Number(r.day_off_fraction) > 0
      );
    }
    return dailyList.filter((r) => r.status === statusFilter);
  }, [dailyList, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: dailyList.length,
      present: dailyList.filter((r) => r.status === "PRESENT").length,
      late: dailyList.filter((r) => r.status === "LATE").length,
      day_off: dailyList.filter(
        (r) => r.status === "DAY_OFF" || r.status === "HALF_DAY_OFF" || Number(r.day_off_fraction) > 0
      ).length,
      absent: dailyList.filter((r) => r.status === "ABSENT").length,
    };
  }, [dailyList]);

  const selectedDayOffEmp = useMemo(() => {
    return activeEmployees.find((e) => Number(e.id) === Number(dayOffEmpId));
  }, [activeEmployees, dayOffEmpId]);

  // TanStack Table columns for Daily Attendance
  const dailyColumns: ColumnDef<any>[] = [
    {
      accessorKey: "operational_date",
      header: "Fecha",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {formatAttendanceDate(info.getValue())}
        </Typography>
      ),
    },
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
      accessorKey: "full_name",
      header: "Trabajador",
      cell: (info) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{String(info.getValue())}</Typography>,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: (info) => {
        const row = info.row.original;
        const fraction = Number(row.day_off_fraction || 0);
        if (row.status === "HALF_DAY_OFF" || fraction === 0.5) {
          const slot = row.day_off_type === "MORNING" ? "Mañana" : row.day_off_type === "AFTERNOON" ? "Tarde" : "0.5d";
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
              <StatusChip status="HALF_DAY_OFF" />
              <Typography variant="caption" color="text.secondary">
                Turno {slot}
              </Typography>
            </Box>
          );
        }
        return <StatusChip status={String(info.getValue())} />;
      },
    },
    {
      accessorKey: "worked_minutes",
      header: "Horas Trabajadas",
      cell: (info) => {
        const mins = Number(info.getValue());
        return (
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {Math.floor(mins / 60)}h {mins % 60}m
          </Typography>
        );
      },
    },
    {
      accessorKey: "late_minutes",
      header: "Tardanza",
      cell: (info) => {
        const mins = Number(info.getValue());
        return mins > 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.main" }}>
            ⚠️ {mins} min
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">0 min</Typography>
        );
      },
    },
    {
      accessorKey: "overtime_minutes",
      header: "Horas Extras",
      cell: (info) => {
        const mins = Number(info.getValue());
        return mins > 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
            ⭐ {mins} min
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">0 min</Typography>
        );
      },
    },
    {
      id: "actions",
      header: "Acción",
      cell: (info) => {
        const rec = info.row.original;
        if (rec.status === "LATE" || rec.status === "ABSENT") {
          return (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={() => openJustification(rec)}
            >
              Justificar / Canjear
            </Button>
          );
        }
        return null;
      },
    },
  ];

  // TanStack Table columns for Sessions
  const sessionColumns: ColumnDef<any>[] = [
    {
      accessorKey: "operational_date",
      header: "Fecha",
      cell: (info) => <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{formatAttendanceDate(info.getValue())}</Typography>,
    },
    {
      accessorKey: "full_name",
      header: "Trabajador",
      cell: (info) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{String(info.getValue())}</Typography>,
    },
    {
      accessorKey: "entry_time",
      header: "Entrada",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "success.main", fontWeight: 700 }}>
          🟢 {new Date(String(info.getValue())).toLocaleTimeString()}
        </Typography>
      ),
    },
    {
      accessorKey: "exit_time",
      header: "Salida",
      cell: (info) => {
        const val = info.getValue();
        return val ? (
          <Typography variant="body2" sx={{ fontFamily: "monospace", color: "error.main", fontWeight: 700 }}>
            🔴 {new Date(String(val)).toLocaleTimeString()}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">— (Abierta)</Typography>
        );
      },
    },
    {
      accessorKey: "worked_minutes",
      header: "Trabajado",
      cell: (info) => {
        const mins = Number(info.getValue());
        return <Typography variant="body2" sx={{ fontWeight: 700 }}>{Math.floor(mins / 60)}h {mins % 60}m</Typography>;
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: (info) => <StatusChip status={String(info.getValue())} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Control de Asistencia"
        subtitle="Monitoreo diario de marcaciones, jornadas, tardanzas e incidencias."
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<BeachAccessIcon />}
            onClick={() => openAssignDayOffModal()}
            sx={{ fontWeight: 700, py: 1, px: 2.5 }}
          >
            + Asignar Descanso
          </Button>
        }
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Resumen Diario" sx={{ fontWeight: 700 }} />
          <Tab label="Sesiones Entrada / Salida" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <Box>
          {/* Quick Filter Chips */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2, alignItems: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", mr: 1, textTransform: "uppercase" }}>
              Filtro Rápido:
            </Typography>
            <Chip
              label={`Todos (${counts.all})`}
              onClick={() => setStatusFilter("ALL")}
              color={statusFilter === "ALL" ? "primary" : "default"}
              variant={statusFilter === "ALL" ? "filled" : "outlined"}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={`🟢 Presentes (${counts.present})`}
              onClick={() => setStatusFilter("PRESENT")}
              color={statusFilter === "PRESENT" ? "success" : "default"}
              variant={statusFilter === "PRESENT" ? "filled" : "outlined"}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={`🟡 Tardanzas (${counts.late})`}
              onClick={() => setStatusFilter("LATE")}
              color={statusFilter === "LATE" ? "warning" : "default"}
              variant={statusFilter === "LATE" ? "filled" : "outlined"}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={`🏖️ En Descanso (${counts.day_off})`}
              onClick={() => setStatusFilter("DAY_OFF")}
              color={statusFilter === "DAY_OFF" ? "info" : "default"}
              variant={statusFilter === "DAY_OFF" ? "filled" : "outlined"}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={`🔴 Faltas (${counts.absent})`}
              onClick={() => setStatusFilter("ABSENT")}
              color={statusFilter === "ABSENT" ? "error" : "default"}
              variant={statusFilter === "ABSENT" ? "filled" : "outlined"}
              sx={{ fontWeight: 700 }}
            />
          </Box>
          <DataTable columns={dailyColumns} data={filteredDailyList} searchPlaceholder="Filtrar por trabajador, DNI o código..." />
        </Box>
      ) : (
        <DataTable columns={sessionColumns} data={sessionsList} searchPlaceholder="Filtrar sesiones..." />
      )}

      {/* Justification Dialog */}
      <Dialog open={showJustModal} onClose={() => setShowJustModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
          Justificar / Canjear Incidencia
          <IconButton onClick={() => setShowJustModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleJustifySubmit}>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {selectedRecord?.full_name} ({formatAttendanceDate(selectedRecord?.operational_date)})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Estado actual: <StatusChip status={selectedRecord?.status || ""} />
              </Typography>
            </Box>

            <TextField
              select
              label="Tipo de Justificación"
              fullWidth
              value={justType}
              onChange={(e) => setJustType(e.target.value)}
            >
              <MenuItem value="LATENESS">Perdonar / Justificar Tardanza (Sin descuento)</MenuItem>
              <MenuItem value="ABSENCE">Justificar Falta por Salud / Permiso</MenuItem>
              <MenuItem value="DAY_OFF_EXCHANGE">Canjear por Día de Descanso Trabajado</MenuItem>
            </TextField>

            {justType === "DAY_OFF_EXCHANGE" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Modalidad de Canje por Descanso</InputLabel>
                  <Select
                    value={exchangeMode}
                    label="Modalidad de Canje por Descanso"
                    onChange={(e) => setExchangeMode(e.target.value as any)}
                  >
                    <MenuItem value="FULL">
                      🌟 1 Día Completo de Descanso (1.0 día)
                    </MenuItem>
                    <MenuItem value="TWO_HALF_DAYS">
                      ⏱️ 2 Medios Días de Descanso (0.5 + 0.5 = 1.0 día completo)
                    </MenuItem>
                    <MenuItem value="HALF">
                      ⏳ 1 Medio Día de Descanso (Cubre 0.5 día)
                    </MenuItem>
                  </Select>
                </FormControl>

                {exchangeMode === "FULL" && (
                  <TextField
                    label="Fecha del Día de Descanso Completo Trabajado"
                    type="date"
                    fullWidth
                    required
                    value={targetDayOffDate}
                    onChange={(e) => setTargetDayOffDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Indica la fecha del descanso rotativo que el empleado laboró."
                  />
                )}

                {exchangeMode === "TWO_HALF_DAYS" && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary" }}>
                      FECHAS DE LOS 2 MEDIOS DÍAS DE DESCANSO TRABAJADOS (0.5 + 0.5 = 1 DÍA):
                    </Typography>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={7}>
                        <TextField
                          label="1er Medio Descanso Trabajado"
                          type="date"
                          fullWidth
                          required
                          size="small"
                          value={targetHalfDay1}
                          onChange={(e) => setTargetHalfDay1(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Franja Horaria</InputLabel>
                          <Select
                            value={targetSlot1}
                            label="Franja Horaria"
                            onChange={(e) => setTargetSlot1(e.target.value)}
                          >
                            <MenuItem value="MORNING">Mañana (0.5d)</MenuItem>
                            <MenuItem value="AFTERNOON">Tarde (0.5d)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={7}>
                        <TextField
                          label="2do Medio Descanso Trabajado"
                          type="date"
                          fullWidth
                          required
                          size="small"
                          value={targetHalfDay2}
                          onChange={(e) => setTargetHalfDay2(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Franja Horaria</InputLabel>
                          <Select
                            value={targetSlot2}
                            label="Franja Horaria"
                            onChange={(e) => setTargetSlot2(e.target.value)}
                          >
                            <MenuItem value="MORNING">Mañana (0.5d)</MenuItem>
                            <MenuItem value="AFTERNOON">Tarde (0.5d)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                      ✔️ La suma de las 2 medias jornadas (0.5 + 0.5) cubrirá la falta completa del día.
                    </Typography>
                  </Box>
                )}

                {exchangeMode === "HALF" && (
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={7}>
                      <TextField
                        label="Fecha Medio Descanso Trabajado"
                        type="date"
                        fullWidth
                        required
                        size="small"
                        value={targetDayOffDate}
                        onChange={(e) => setTargetDayOffDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Franja Horaria</InputLabel>
                        <Select
                          value={targetSlot1}
                          label="Franja Horaria"
                          onChange={(e) => setTargetSlot1(e.target.value)}
                        >
                          <MenuItem value="MORNING">Mañana (0.5d)</MenuItem>
                          <MenuItem value="AFTERNOON">Tarde (0.5d)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        💡 Cubre 0.5 día de falta. El día quedará registrado como medio descanso.
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}

            <TextField
              label="Motivo / Sustento de Justificación"
              fullWidth
              multiline
              rows={3}
              required
              placeholder="Describa el motivo médico, de emergencia o autorización administrativa..."
              value={justReason}
              onChange={(e) => setJustReason(e.target.value)}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowJustModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="warning" sx={{ px: 3 }}>
              Guardar Justificación
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal Asignar Descanso Administrativo */}
      <Dialog open={showDayOffModal} onClose={() => setShowDayOffModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, color: "primary.main" }}>
          🏖️ Asignar Día de Descanso (Administración)
          <IconButton onClick={() => setShowDayOffModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleDayOffSubmit}>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <FormControl fullWidth required>
              <InputLabel>Seleccione Trabajador</InputLabel>
              <Select
                value={dayOffEmpId}
                label="Seleccione Trabajador"
                onChange={(e) => setDayOffEmpId(e.target.value)}
              >
                {activeEmployees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.employee_code} · {emp.first_name} {emp.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha del Descanso"
              type="date"
              fullWidth
              required
              value={dayOffDate}
              onChange={(e) => setDayOffDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            {selectedDayOffEmp && (
              <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Permiso de Medio Día: <strong>{selectedDayOffEmp.allow_half_day_off ? "Habilitado (0.5d)" : "No Habilitado (Solo 1.0d)"}</strong>
                </Typography>
                {!selectedDayOffEmp.allow_half_day_off && (
                  <Typography variant="caption" color="warning.main">
                    ℹ️ Este trabajador solo puede tomar días completos según su configuración de usuario.
                  </Typography>
                )}
              </Box>
            )}

            <FormControl component="fieldset">
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", mb: 1 }}>
                Modalidad de Descanso
              </Typography>
              <RadioGroup
                value={dayOffSlot}
                onChange={(e) => {
                  const val = e.target.value;
                  setDayOffSlot(val);
                  setDayOffFraction(val === "FULL" ? 1.0 : 0.5);
                }}
              >
                <FormControlLabel value="FULL" control={<Radio />} label="Día Completo (1.0 día de descanso)" />
                <FormControlLabel
                  value="MORNING"
                  disabled={!selectedDayOffEmp?.allow_half_day_off}
                  control={<Radio />}
                  label="Medio Día — Turno Mañana (0.5 día de descanso)"
                />
                <FormControlLabel
                  value="AFTERNOON"
                  disabled={!selectedDayOffEmp?.allow_half_day_off}
                  control={<Radio />}
                  label="Medio Día — Turno Tarde (0.5 día de descanso)"
                />
              </RadioGroup>
            </FormControl>

            <TextField
              label="Notas / Motivo (Opcional)"
              fullWidth
              placeholder="ej. Coordinado vía llamada telefónica / cambio de turno"
              value={dayOffNotes}
              onChange={(e) => setDayOffNotes(e.target.value)}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowDayOffModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submittingDayOff} sx={{ px: 3, fontWeight: 700 }}>
              {submittingDayOff ? "Guardando..." : "Confirmar Descanso"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
