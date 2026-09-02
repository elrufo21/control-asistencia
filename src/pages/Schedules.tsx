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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import { apiFetch } from "../services/api";
import { PageHeader } from "../components/PageHeader";

export const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("08:30");
  const [endTime, setEndTime] = useState("22:00");
  const [breakStart, setBreakStart] = useState("13:00");
  const [breakEnd, setBreakEnd] = useState("15:00");
  const [tolerance, setTolerance] = useState("10");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await apiFetch("/schedules");
      setSchedules(data || []);
    } catch (e) {
      console.error(e);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description,
        shifts: [
          {
            name: "Turno Completo",
            start_time: startTime,
            end_time: endTime,
            break_start_time: breakStart || null,
            break_end_time: breakEnd || null,
            check_in_tolerance_min: Number(tolerance),
            check_out_tolerance_min: Number(tolerance),
          },
        ],
      };

      await apiFetch("/schedules", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setShowModal(false);
      setName("");
      setDescription("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Error al crear horario");
    }
  };

  return (
    <Box>
      <PageHeader
        title="Plantillas de Horarios y Turnos"
        subtitle="Configuración de horas de entrada, salida, refrigerios y tolerancias."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowModal(true)} sx={{ py: 1.2, px: 3 }}>
            Nuevo Horario
          </Button>
        }
      />

      <Grid container spacing={3}>
        {schedules.map((s) => (
          <Grid item xs={12} md={6} key={s.id}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "flex-start" }, mb: 2, pb: 1.5, borderBottom: "1px solid #e2e8f0" }}>
                  <Box>
                    <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarMonthIcon color="primary" /> {s.name}
                    </Typography>
                    {s.description && (
                      <Typography variant="caption" color="text.secondary">
                        {s.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip label={s.status} color="success" size="small" sx={{ fontWeight: 700 }} />
                </Box>

                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 1.5 }}>
                  Turnos Incluidos
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {s.shifts?.map((sh: any) => (
                    <Paper key={sh.id} variant="outlined" sx={{ p: 2, bgcolor: "#f8fafc" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {sh.name}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontFamily: "monospace", color: "primary.main", fontWeight: 700 }}>
                          {sh.start_time?.slice(0, 5)} - {sh.end_time?.slice(0, 5)}
                        </Typography>
                      </Box>
                      {sh.break_start_time && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 14, color: "warning.main" }} />
                          Almuerzo: {sh.break_start_time?.slice(0, 5)} a {sh.break_end_time?.slice(0, 5)}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        Tolerancia de entrada: {sh.check_in_tolerance_min} minutos
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* MUI Modal Form */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
          Crear Horario y Turno
          <IconButton onClick={() => setShowModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Nombre del Horario"
              fullWidth
              required
              placeholder="ej. Horario Tienda Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <TextField
              label="Descripción"
              fullWidth
              placeholder="ej. De 8:30 a 22:00 con 2h almuerzo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hora Entrada"
                  type="time"
                  fullWidth
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hora Salida"
                  type="time"
                  fullWidth
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Inicio Almuerzo"
                  type="time"
                  fullWidth
                  value={breakStart}
                  onChange={(e) => setBreakStart(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fin Almuerzo"
                  type="time"
                  fullWidth
                  value={breakEnd}
                  onChange={(e) => setBreakEnd(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Tolerancia Entrada (minutos)"
              type="number"
              fullWidth
              required
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ px: 3 }}>
              Guardar Horario
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
