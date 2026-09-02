import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
  InputAdornment,
  Container,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import { apiFetch } from "../services/api";
import { useAppStore } from "../store/useAppStore";

export const Login: React.FC = () => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAppStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setAuth(data.token, data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Error de inicio de sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#0f172a",
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Card sx={{ borderRadius: 4, shadow: 10, overflow: "hidden" }}>
          <Box sx={{ bgcolor: "primary.main", color: "white", p: { xs: 2.5, sm: 4 }, textAlign: "center" }}>
            <Avatar sx={{ m: "0 auto 12px", bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}>
              <AccessTimeFilledIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Control de Asistencia
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              Plataforma Web Cloud
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                <TextField
                  label="Usuario"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Contraseña"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.5, mt: 1, fontSize: "0.95rem", fontWeight: 700 }}
                >
                  {loading ? "Ingresando..." : "Ingresar al Sistema"}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
