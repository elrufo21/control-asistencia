import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { ColumnDef } from "@tanstack/react-table";
import { apiFetch } from "../services/api";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/DataTable";
import { StatusChip } from "../components/StatusChip";

export const Attendance: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dailyList, setDailyList] = useState<any[]>([]);
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [showJustModal, setShowJustModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [justReason, setJustReason] = useState("");
  const [justType, setJustType] = useState("LATENESS");
  const [targetDayOffDate, setTargetDayOffDate] = useState("");

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

  const openJustification = (rec: any) => {
    setSelectedRecord(rec);
    setJustReason("");
    setJustType("LATENESS");
    setTargetDayOffDate("");
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
          target_day_off_date: justType === "DAY_OFF_EXCHANGE" ? targetDayOffDate : undefined,
        }),
      });
      setShowJustModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Error al justificar");
    }
  };

  // TanStack Table columns for Daily Attendance
  const dailyColumns: ColumnDef<any>[] = [
    {
      accessorKey: "operational_date",
      header: "Fecha",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {String(info.getValue()).slice(0, 10)}
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
      cell: (info) => <StatusChip status={String(info.getValue())} />,
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
      cell: (info) => <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{String(info.getValue()).slice(0, 10)}</Typography>,
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
        <DataTable columns={dailyColumns} data={dailyList} searchPlaceholder="Filtrar por trabajador, DNI o código..." />
      ) : (
        <DataTable columns={sessionColumns} data={sessionsList} searchPlaceholder="Filtrar sesiones..." />
      )}

      {/* Justification Dialog */}
      <Dialog open={showJustModal} onClose={() => setShowJustModal(false)} maxWidth="xs" fullWidth>
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
                {selectedRecord?.full_name} ({selectedRecord?.operational_date?.slice(0, 10)})
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
              <TextField
                label="Fecha del Día Descanso Trabajado"
                type="date"
                fullWidth
                required
                value={targetDayOffDate}
                onChange={(e) => setTargetDayOffDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
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
    </Box>
  );
};
