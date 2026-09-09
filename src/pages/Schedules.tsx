import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Paper,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ScheduleIcon from "@mui/icons-material/Schedule";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { apiFetch } from "../services/api";
import { PageHeader } from "../components/PageHeader";

interface ShiftFormItem {
  id?: number;
  name: string;
  start_time: string;
  end_time: string;
  break_start_time: string;
  break_end_time: string;
  check_in_tolerance_min: number;
  check_out_tolerance_min: number;
  crosses_midnight: boolean;
}

interface ScheduleItem {
  id: number;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  is_deleted?: boolean;
  shifts: any[];
}

function calculateShiftDuration(start?: string, end?: string, breakStart?: string, breakEnd?: string) {
  if (!start || !end) return null;
  const parseMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  let totalMin = parseMin(end) - parseMin(start);
  if (totalMin <= 0) totalMin += 24 * 60; // cruza medianoche

  let breakMin = 0;
  if (breakStart && breakEnd) {
    breakMin = parseMin(breakEnd) - parseMin(breakStart);
    if (breakMin < 0) breakMin += 24 * 60;
  }

  const effectiveMin = Math.max(0, totalMin - breakMin);
  const effH = Math.floor(effectiveMin / 60);
  const effM = effectiveMin % 60;
  const breakH = Math.floor(breakMin / 60);
  const breakM = breakMin % 60;

  return {
    grossHours: (totalMin / 60).toFixed(1),
    effectiveText: `${effH}h${effM > 0 ? ` ${effM}m` : ""}`,
    breakText: breakMin > 0 ? `${breakH > 0 ? `${breakH}h ` : ""}${breakM > 0 ? `${breakM}m` : ""}`.trim() : null,
  };
}

export const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [shifts, setShifts] = useState<ShiftFormItem[]>([]);

  // Delete Confirm State
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; schedule: ScheduleItem | null }>({
    open: false,
    schedule: null,
  });

  // Notifications
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await apiFetch("/schedules");
      setSchedules(data || []);
    } catch (e: any) {
      console.error(e);
      showSnackbar(e.message || "Error al cargar horarios", "error");
    } finally {
      setLoading(false);
    }
  }

  const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleOpenCreate = () => {
    setEditingSchedule(null);
    setName("");
    setDescription("");
    setStatus("ACTIVE");
    setShifts([
      {
        name: "Turno Principal",
        start_time: "08:30",
        end_time: "18:30",
        break_start_time: "13:00",
        break_end_time: "14:00",
        check_in_tolerance_min: 10,
        check_out_tolerance_min: 10,
        crosses_midnight: false,
      },
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = (s: ScheduleItem) => {
    setEditingSchedule(s);
    setName(s.name);
    setDescription(s.description || "");
    setStatus(s.status || "ACTIVE");

    const mappedShifts: ShiftFormItem[] =
      s.shifts && s.shifts.length > 0
        ? s.shifts.map((sh: any) => ({
            id: sh.id,
            name: sh.name || "Turno",
            start_time: sh.start_time?.slice(0, 5) || "08:30",
            end_time: sh.end_time?.slice(0, 5) || "18:30",
            break_start_time: sh.break_start_time ? sh.break_start_time.slice(0, 5) : "",
            break_end_time: sh.break_end_time ? sh.break_end_time.slice(0, 5) : "",
            check_in_tolerance_min: Number(sh.check_in_tolerance_min ?? 10),
            check_out_tolerance_min: Number(sh.check_out_tolerance_min ?? 10),
            crosses_midnight: Boolean(sh.crosses_midnight),
          }))
        : [
            {
              name: "Turno Principal",
              start_time: "08:30",
              end_time: "18:30",
              break_start_time: "13:00",
              break_end_time: "14:00",
              check_in_tolerance_min: 10,
              check_out_tolerance_min: 10,
              crosses_midnight: false,
            },
          ];

    setShifts(mappedShifts);
    setShowModal(true);
  };

  const handleAddShift = () => {
    setShifts((prev) => [
      ...prev,
      {
        name: `Turno ${prev.length + 1}`,
        start_time: "14:00",
        end_time: "22:00",
        break_start_time: "",
        break_end_time: "",
        check_in_tolerance_min: 10,
        check_out_tolerance_min: 10,
        crosses_midnight: false,
      },
    ]);
  };

  const handleRemoveShift = (index: number) => {
    if (shifts.length <= 1) {
      showSnackbar("El horario debe contener al menos un turno.", "error");
      return;
    }
    setShifts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleShiftChange = (index: number, field: keyof ShiftFormItem, value: any) => {
    setShifts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showSnackbar("El nombre del horario es requerido", "error");
      return;
    }

    if (shifts.length === 0) {
      showSnackbar("Debes configurar al menos un turno de trabajo", "error");
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        shifts: shifts.map((sh) => ({
          ...(sh.id ? { id: sh.id } : {}),
          name: sh.name.trim() || "Turno",
          start_time: sh.start_time,
          end_time: sh.end_time,
          break_start_time: sh.break_start_time || null,
          break_end_time: sh.break_end_time || null,
          check_in_tolerance_min: Number(sh.check_in_tolerance_min || 0),
          check_out_tolerance_min: Number(sh.check_out_tolerance_min || 0),
          crosses_midnight: Boolean(sh.crosses_midnight),
        })),
      };

      if (editingSchedule) {
        await apiFetch(`/schedules/${editingSchedule.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showSnackbar(`Horario "${name}" actualizado con éxito.`);
      } else {
        await apiFetch("/schedules", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showSnackbar(`Horario "${name}" creado con éxito.`);
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      showSnackbar(err.message || "Error al guardar horario", "error");
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteDialog.schedule) return;
    try {
      await apiFetch(`/schedules/${deleteDialog.schedule.id}`, {
        method: "DELETE",
      });
      showSnackbar(`Horario "${deleteDialog.schedule.name}" eliminado correctamente.`);
      setDeleteDialog({ open: false, schedule: null });
      loadData();
    } catch (err: any) {
      showSnackbar(err.message || "No se pudo eliminar el horario", "error");
    }
  };

  return (
    <Box>
      <PageHeader
        title="Plantillas de Horarios y Turnos"
        subtitle="Configuración editable de horas de entrada, salida, refrigerios y tolerancias."
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ py: 1.2, px: 3, fontWeight: 700, borderRadius: 2 }}
          >
            Nuevo Horario
          </Button>
        }
      />

      <Grid container spacing={3}>
        {schedules.map((s) => (
          <Grid item xs={12} md={6} key={s.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #e2e8f0",
                borderRadius: 3,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                  borderColor: "#cbd5e1",
                },
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                {/* Header Card */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                    pb: 1.5,
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <Box sx={{ flexGrow: 1, mr: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <CalendarMonthIcon color="primary" sx={{ fontSize: 22 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontSize: "1.05rem" }}>
                        {s.name}
                      </Typography>
                    </Box>
                    {s.description ? (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                        {s.description}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                        Sin descripción
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={s.status === "ACTIVE" ? "Activo" : "Inactivo"}
                      color={s.status === "ACTIVE" ? "success" : "default"}
                      size="small"
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                    <Tooltip title="Editar Horario y Turnos">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(s)}
                        sx={{
                          bgcolor: "#eff6ff",
                          color: "primary.main",
                          "&:hover": { bgcolor: "#dbeafe" },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar Horario">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, schedule: s })}
                        sx={{
                          bgcolor: "#fef2f2",
                          color: "error.main",
                          "&:hover": { bgcolor: "#fee2e2" },
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Shifts List */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Turnos Incluidos ({s.shifts?.length || 0})
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flexGrow: 1 }}>
                  {s.shifts?.map((sh: any, idx: number) => {
                    const dur = calculateShiftDuration(
                      sh.start_time?.slice(0, 5),
                      sh.end_time?.slice(0, 5),
                      sh.break_start_time?.slice(0, 5),
                      sh.break_end_time?.slice(0, 5)
                    );

                    return (
                      <Paper
                        key={sh.id || idx}
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: "#f8fafc",
                          borderRadius: 2,
                          borderColor: "#e2e8f0",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                            <ScheduleIcon sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                              {sh.name}
                            </Typography>
                          </Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontFamily: "monospace",
                              bgcolor: "#e0e7ff",
                              color: "#3730a3",
                              px: 1.2,
                              py: 0.2,
                              borderRadius: 1,
                              fontWeight: 800,
                              fontSize: "0.85rem",
                            }}
                          >
                            {sh.start_time?.slice(0, 5)} - {sh.end_time?.slice(0, 5)}
                          </Typography>
                        </Box>

                        <Grid container spacing={1} sx={{ mt: 0.5 }}>
                          {sh.break_start_time && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                                <RestaurantIcon sx={{ fontSize: 15, color: "warning.main" }} />
                                <Typography variant="caption" sx={{ color: "#475569" }}>
                                  Almuerzo: <strong>{sh.break_start_time?.slice(0, 5)}</strong> a{" "}
                                  <strong>{sh.break_end_time?.slice(0, 5)}</strong>
                                </Typography>
                              </Box>
                            </Grid>
                          )}

                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                              <AccessTimeIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                              <Typography variant="caption" sx={{ color: "#475569" }}>
                                Tolerancia: <strong>{sh.check_in_tolerance_min || 10}m</strong> entrada
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {dur && (
                          <Box
                            sx={{
                              mt: 1.5,
                              pt: 1,
                              borderTop: "1px dashed #cbd5e1",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                              <WorkHistoryIcon sx={{ fontSize: 15, color: "success.main" }} />
                              <Typography variant="caption" sx={{ color: "#334155", fontWeight: 600 }}>
                                Jornada efectiva: <strong>{dur.effectiveText}</strong>
                              </Typography>
                            </Box>
                            {dur.breakText && (
                              <Typography variant="caption" sx={{ color: "#64748b" }}>
                                Refrigerio: {dur.breakText}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Modal Crear / Editar Horario y Turnos */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 800,
            bgcolor: editingSchedule ? "#f8fafc" : "inherit",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {editingSchedule ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {editingSchedule ? `Editar Horario: ${editingSchedule.name}` : "Nuevo Horario y Turnos"}
            </Typography>
          </Box>
          <IconButton onClick={() => setShowModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, py: 3 }}>
            {/* Sección 1: Datos del Horario */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: "#1e293b", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
              >
                1. Información General del Horario
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Nombre del Horario"
                    fullWidth
                    required
                    placeholder="ej. Horario Planta Mañana"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={status}
                      label="Estado"
                      onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    >
                      <MenuItem value="ACTIVE">Activo</MenuItem>
                      <MenuItem value="INACTIVE">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Descripción"
                    fullWidth
                    placeholder="ej. Turno estándar de 8:30 a 18:30 con 1h almuerzo"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Sección 2: Configuración de Turnos */}
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 1 }}
                >
                  2. Turnos Asociados ({shifts.length})
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddShift}
                  sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: "none" }}
                >
                  Agregar Otro Turno
                </Button>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {shifts.map((sh, idx) => {
                  const dur = calculateShiftDuration(
                    sh.start_time,
                    sh.end_time,
                    sh.break_start_time,
                    sh.break_end_time
                  );

                  return (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <TextField
                          label="Nombre del Turno"
                          size="small"
                          required
                          value={sh.name}
                          onChange={(e) => handleShiftChange(idx, "name", e.target.value)}
                          sx={{ width: "65%", bgcolor: "#fff" }}
                        />
                        {shifts.length > 1 && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => handleRemoveShift(idx)}
                            sx={{ textTransform: "none" }}
                          >
                            Quitar
                          </Button>
                        )}
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={6}>
                          <TextField
                            label="Hora de Entrada"
                            type="time"
                            fullWidth
                            required
                            size="small"
                            value={sh.start_time}
                            onChange={(e) => handleShiftChange(idx, "start_time", e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ bgcolor: "#fff" }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={6}>
                          <TextField
                            label="Hora de Salida"
                            type="time"
                            fullWidth
                            required
                            size="small"
                            value={sh.end_time}
                            onChange={(e) => handleShiftChange(idx, "end_time", e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ bgcolor: "#fff" }}
                          />
                        </Grid>

                        <Grid item xs={6} sm={6}>
                          <TextField
                            label="Inicio Almuerzo / Refrigerio"
                            type="time"
                            fullWidth
                            size="small"
                            value={sh.break_start_time}
                            onChange={(e) => handleShiftChange(idx, "break_start_time", e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ bgcolor: "#fff" }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={6}>
                          <TextField
                            label="Fin Almuerzo / Refrigerio"
                            type="time"
                            fullWidth
                            size="small"
                            value={sh.break_end_time}
                            onChange={(e) => handleShiftChange(idx, "break_end_time", e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ bgcolor: "#fff" }}
                          />
                        </Grid>

                        <Grid item xs={6} sm={6}>
                          <TextField
                            label="Tolerancia Entrada (min)"
                            type="number"
                            fullWidth
                            size="small"
                            value={sh.check_in_tolerance_min}
                            onChange={(e) =>
                              handleShiftChange(idx, "check_in_tolerance_min", Number(e.target.value))
                            }
                            sx={{ bgcolor: "#fff" }}
                          />
                        </Grid>
                        <Grid item xs={6} sm={6}>
                          <TextField
                            label="Tolerancia Salida (min)"
                            type="number"
                            fullWidth
                            size="small"
                            value={sh.check_out_tolerance_min}
                            onChange={(e) =>
                              handleShiftChange(idx, "check_out_tolerance_min", Number(e.target.value))
                            }
                            sx={{ bgcolor: "#fff" }}
                          />
                        </Grid>
                      </Grid>

                      {dur && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 1.2,
                            bgcolor: "#e2e8f0",
                            borderRadius: 1.5,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="caption" sx={{ color: "#1e293b", fontWeight: 700 }}>
                            ⏱️ Jornada Efectiva Estimada: {dur.effectiveText}
                          </Typography>
                          {dur.breakText && (
                            <Typography variant="caption" sx={{ color: "#475569" }}>
                              🍽️ Almuerzo: {dur.breakText}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
            <Button onClick={() => setShowModal(false)} color="inherit" sx={{ fontWeight: 600 }}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ px: 3, fontWeight: 700, borderRadius: 2 }}>
              {editingSchedule ? "Guardar Cambios" : "Crear Horario"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, schedule: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main", fontWeight: 800 }}>
          <WarningAmberIcon color="error" />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#334155", mb: 1.5 }}>
            ¿Estás seguro de que deseas eliminar el horario{" "}
            <strong>"{deleteDialog.schedule?.name}"</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            Esta acción desactivará el horario y sus turnos. Si hay colaboradores con este horario asignado, el sistema
            bloqueará la eliminación para proteger la integridad de los registros.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, schedule: null })}
            color="inherit"
            sx={{ fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteSchedule}
            variant="contained"
            color="error"
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Sí, Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de Retroalimentación */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%", fontWeight: 600 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
