import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SettingsIcon from "@mui/icons-material/Settings";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { apiFetch } from "../services/api";
import { PageHeader } from "../components/PageHeader";

export const Settings: React.FC = () => {
  const [allowManual, setAllowManual] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await apiFetch("/settings");
      if (Array.isArray(data)) {
        const item = data.find((s: any) => s.key === "ALLOW_MANUAL_PUNCH");
        if (item) setAllowManual(item.value === "true");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Error al cargar configuraciones");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await apiFetch("/settings", {
        method: "PUT",
        body: JSON.stringify({
          settings: [
            { key: "ALLOW_MANUAL_PUNCH", value: allowManual ? "true" : "false" },
          ],
        }),
      });
      setSuccessMsg("¡Configuración guardada exitosamente! El kiosco actualizará este cambio en su próxima sincronización.");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Configuración del Sistema"
        subtitle="Administra los parámetros globales del sistema, seguridad y comportamiento de los Kioscos de asistencia."
      />

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, fontWeight: 600 }}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, fontWeight: 600 }}>
          {errorMsg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, maxWidth: 800, bgcolor: "#ffffff" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <CameraAltIcon color="primary" /> Configuración de Kiosco de Escritorio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Define las reglas operativas y de seguridad para las estaciones de marcación de escritorio.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={allowManual}
                  onChange={(e) => setAllowManual(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Habilitar Marcación Manual (Selector por Código / Nombre)
                </Typography>
              }
            />

            <Typography variant="caption" color="text.secondary" sx={{ pl: 4, display: "block" }}>
              • <b>Desactivado (Recomendado)</b>: El Kiosco de escritorio funciona <b>100% mediante Cámara Facial</b>. No permite seleccionar nombres manualmente.
              <br />
              • <b>Activado (Modo Emergencia)</b>: Permite a los trabajadores seleccionar su nombre o código en caso de fallas físicas en la cámara web.
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            fullWidth
            sx={{ maxWidth: { sm: 320 }, px: 4, py: 1.2, fontWeight: 700 }}
          >
            {saving ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </Paper>
      )}
    </Box>
  );
};
