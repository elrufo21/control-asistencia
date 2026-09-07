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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
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
  const [detailTab, setDetailTab] = useState(0);

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
    setWorkDays(parseWorkDays(emp.work_days));
    setScheduleId(emp.schedule_id ? String(emp.schedule_id) : (schedules.length ? String(schedules[0].id) : ""));
    setShowModal(true);
  };

  const openDetailModal = async (emp: any) => {
    setSelectedEmp(emp);
    setDetailTab(0);
    setShowDetailModal(true);
    try {
      const history = await apiFetch(`/attendance/daily?employee_id=${emp.id}`);
      setEmpDailyList(history || []);
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
      accessorKey: "daily_rate",
      header: "Tarifa Diaria",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          S/ {Number(info.getValue()).toFixed(2)}
        </Typography>
      ),
    },
    {
      accessorKey: "work_days",
      header: "Días Laborales",
      cell: (info) => {
        const days: string[] = parseWorkDays(info.getValue());
        return (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {ALL_DAYS.map((d) => {
              const active = days.includes(d.key);
              return (
                <Chip
                  key={d.key}
                  label={d.label}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    bgcolor: active ? "primary.main" : "#f1f5f9",
                    color: active ? "#ffffff" : "#94a3b8",
                  }}
                />
              );
            })}
          </Box>
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
                Contrato: {selectedEmp.contract_type === "CONTRACT" ? "Por Contrata (Día 7)" : "Por Días"} · Tarifa: S/ {Number(selectedEmp.daily_rate).toFixed(2)}/día
              </Typography>
            </Box>

            {detailTab === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <CalendarMonthIcon color="primary" /> Días de Trabajo Asignados (Semanal)
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {ALL_DAYS.map((d) => {
                      const active = selectedEmp.work_days?.includes(d.key);
                      return (
                        <Chip
                          key={d.key}
                          label={d.label}
                          color={active ? "primary" : "default"}
                          sx={{ fontWeight: 700, px: 1 }}
                        />
                      );
                    })}
                  </Box>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <AccessTimeIcon color="secondary" /> Horario Vigente
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Horario General 8:30am - 6:30pm (Tolerancia 10 min)
                  </Typography>
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
                    const dateStr = r.operational_date?.slice(0, 10);
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
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
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
                  label="Cargo / Puesto"
                  fullWidth
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
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

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Tipo de Contrato"
                  fullWidth
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                >
                  <MenuItem value="CONTRACT">Por Contrata (Aplica Día 7)</MenuItem>
                  <MenuItem value="PER_DAY">Por Días Laborados</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
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
            </Grid>

            {/* Workdays chips selector */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 1 }}>
                Días Laborales del Trabajador (Domingo a Domingo)
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {ALL_DAYS.map((d) => {
                  const active = workDays.includes(d.key);
                  return (
                    <Chip
                      key={d.key}
                      label={d.label}
                      clickable
                      color={active ? "primary" : "default"}
                      onClick={() => handleDayToggle(d.key)}
                      sx={{ fontWeight: 700 }}
                    />
                  );
                })}
              </Box>
            </Box>
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
    </Box>
  );
};
