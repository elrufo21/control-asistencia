import React, { useEffect, useState } from "react";
import { Grid, Box, Typography, Paper, CircularProgress } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { ColumnDef } from "@tanstack/react-table";
import { apiFetch } from "../services/api";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/DataTable";
import { StatusChip } from "../components/StatusChip";

export const Dashboard: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const empData = await apiFetch("/employees");
        setEmployees(empData.items || []);

        const incData = await apiFetch("/attendance/incidents?status=PENDING");
        setIncidents(incData || []);

        const sessData = await apiFetch("/attendance/sessions?status=OPEN");
        setSessions(sessData || []);
      } catch (err) {
        console.error("Error al cargar dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;

  // TanStack Table columns for Open Sessions
  const sessionColumns: ColumnDef<any>[] = [
    {
      accessorKey: "full_name",
      header: "Trabajador",
      cell: (info) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{String(info.getValue())}</Typography>,
    },
    {
      accessorKey: "shift_name",
      header: "Turno",
      cell: (info) => <Typography variant="caption" color="text.secondary">{String(info.getValue() || "Sin turno")}</Typography>,
    },
    {
      accessorKey: "entry_time",
      header: "Hora Entrada",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "success.main", fontWeight: 700 }}>
          🟢 {new Date(String(info.getValue())).toLocaleTimeString()}
        </Typography>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: (info) => <StatusChip status={String(info.getValue())} />,
    },
  ];

  // TanStack Table columns for Incidents
  const incidentColumns: ColumnDef<any>[] = [
    {
      accessorKey: "full_name",
      header: "Trabajador",
      cell: (info) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{String(info.getValue())}</Typography>,
    },
    {
      accessorKey: "description",
      header: "Descripción Incidencia",
      cell: (info) => <Typography variant="body2" color="text.secondary">{String(info.getValue())}</Typography>,
    },
    {
      accessorKey: "incident_type",
      header: "Tipo",
      cell: (info) => <StatusChip status={String(info.getValue())} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Dashboard General"
        subtitle="Resumen de personal activo, asistencias del día e incidencias en tiempo real."
      />

      {/* Metric Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Trabajadores Activos"
            value={activeCount}
            icon={<PeopleIcon />}
            color="#1e40af"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Registrados"
            value={employees.length}
            icon={<CheckCircleIcon />}
            color="#059669"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Sesiones Abiertas"
            value={sessions.length}
            icon={<AccessTimeIcon />}
            color="#d97706"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Incidencias Pendientes"
            value={incidents.length}
            icon={<WarningAmberIcon />}
            color="#dc2626"
          />
        </Grid>
      </Grid>

      {/* TanStack DataTables Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <AccessTimeIcon sx={{ color: "warning.main" }} /> Sesiones Activas (Sin Salida)
            </Typography>
            <DataTable columns={sessionColumns} data={sessions} searchPlaceholder="Filtrar sesiones..." />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <WarningAmberIcon sx={{ color: "error.main" }} /> Novedades e Incidencias Pendientes
            </Typography>
            <DataTable columns={incidentColumns} data={incidents} searchPlaceholder="Filtrar incidencias..." />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
