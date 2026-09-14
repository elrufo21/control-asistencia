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
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import LockResetIcon from "@mui/icons-material/LockReset";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { apiFetch } from "../services/api";
import { PageHeader } from "../components/PageHeader";

export const Settings: React.FC = () => {
  // Configuración del Kiosco
  const [allowManual, setAllowManual] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Cambio de contraseña del administrador
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState("");
  const [passErrorMsg, setPassErrorMsg] = useState("");

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

  const handleSaveKioskSettings = async () => {
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccessMsg("");
    setPassErrorMsg("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassErrorMsg("Debe completar todos los campos de contraseña.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassErrorMsg("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    if (newPassword.length < 6) {
      setPassErrorMsg("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setPassSaving(true);
    try {
      const res = await apiFetch("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      setPassSuccessMsg(res.message || "¡Contraseña actualizada exitosamente!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPassErrorMsg(err.message || "Error al actualizar contraseña");
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Configuración del Sistema"
        subtitle="Administra los parámetros globales del sistema, seguridad y credenciales de acceso administrativo."
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 800 }}>
          {/* TARJETA 1: SEGURIDAD Y CAMBIO DE CONTRASEÑA ADMINISTRATIVA */}
          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, bgcolor: "#ffffff" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5, mb: 1, color: "#0f172a" }}>
              <LockResetIcon color="primary" /> Seguridad y Cambio de Contraseña del Administrador
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Modifica periódicamente tu contraseña administrativa para proteger el panel contra accesos no autorizados.
            </Typography>

            {passSuccessMsg && (
              <Alert severity="success" sx={{ mb: 3, fontWeight: 600 }}>
                {passSuccessMsg}
              </Alert>
            )}

            {passErrorMsg && (
              <Alert severity="error" sx={{ mb: 3, fontWeight: 600 }}>
                {passErrorMsg}
              </Alert>
            )}

            <Box component="form" onSubmit={handleChangePassword} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Contraseña Actual"
                type={showCurrentPass ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                fullWidth
                size="small"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        edge="end"
                        size="small"
                        aria-label="mostrar u ocultar contraseña"
                      >
                        {showCurrentPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Nueva Contraseña"
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  fullWidth
                  size="small"
                  required
                  helperText="Mínimo 6 caracteres"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPass(!showNewPass)}
                          edge="end"
                          size="small"
                          aria-label="mostrar u ocultar contraseña"
                        >
                          {showNewPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Confirmar Nueva Contraseña"
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  fullWidth
                  size="small"
                  required
                  helperText="Debe coincidir exactamente"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          edge="end"
                          size="small"
                          aria-label="mostrar u ocultar contraseña"
                        >
                          {showConfirmPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Divider sx={{ my: 1 }} />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={passSaving ? <CircularProgress size={18} color="inherit" /> : <LockResetIcon />}
                disabled={passSaving}
                sx={{ alignSelf: { sm: "flex-start" }, px: 4, py: 1.2, fontWeight: 700, borderRadius: 2 }}
              >
                {passSaving ? "Actualizando..." : "Actualizar Contraseña"}
              </Button>
            </Box>
          </Paper>

          {/* TARJETA 2: CONFIGURACIÓN DE KIOSCO */}
          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, bgcolor: "#ffffff" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5, mb: 1, color: "#0f172a" }}>
              <CameraAltIcon color="primary" /> Configuración de Kiosco de Escritorio
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Define las reglas operativas y de seguridad para las estaciones de marcación de escritorio.
            </Typography>

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
              onClick={handleSaveKioskSettings}
              disabled={saving}
              sx={{ alignSelf: { sm: "flex-start" }, px: 4, py: 1.2, fontWeight: 700, borderRadius: 2 }}
            >
              {saving ? "Guardando..." : "Guardar Configuración de Kiosco"}
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
};
