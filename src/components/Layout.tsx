import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PaymentsIcon from "@mui/icons-material/Payments";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import { useAppStore } from "../store/useAppStore";

const DRAWER_WIDTH = 260;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout, mobileOpen, toggleMobileOpen, setMobileOpen } = useAppStore();

  const navItems = [
    { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
    { label: "Empleados", path: "/employees", icon: <PeopleIcon /> },
    { label: "Horarios y Turnos", path: "/schedules", icon: <CalendarMonthIcon /> },
    { label: "Asistencia", path: "/attendance", icon: <FactCheckIcon /> },
    { label: "Planilla y Pagos", path: "/payroll", icon: <PaymentsIcon /> },
    { label: "Configuración", path: "/settings", icon: <SettingsIcon /> },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#0f172a", color: "#f8fafc" }}>
      {/* Brand Header */}
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, borderBottom: "1px solid #1e293b" }}>
        <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>
          <AccessTimeFilledIcon />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, leading: 1.2, color: "#ffffff" }}>
            Control Asistencia
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            Plataforma Web Cloud
          </Typography>
        </Box>
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 2, py: 2, flexGrow: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 1,
                bgcolor: active ? "primary.main" : "transparent",
                color: active ? "#ffffff" : "#94a3b8",
                "&:hover": {
                  bgcolor: active ? "primary.dark" : "#1e293b",
                  color: "#ffffff",
                },
              }}
            >
              <ListItemIcon sx={{ color: active ? "#ffffff" : "#94a3b8", minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: active ? 700 : 500 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* User Footer */}
      <Box sx={{ p: 2.5, borderTop: "1px solid #1e293b", bgcolor: "#090d16" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyBetween: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "#334155", width: 36, height: 36, fontSize: "0.9rem", fontWeight: 700 }}>
              {user?.username?.[0]?.toUpperCase() || "U"}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#ffffff" }}>
                {user?.username || "Admin"}
              </Typography>

              <Chip
                label={user?.role || "ADMIN"}
                size="small"
                sx={{ height: 18, fontSize: "0.65rem", fontWeight: 800, bgcolor: "#1e293b", color: "#38bdf8" }}
              />
            </Box>
          </Box>
        </Box>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ borderColor: "#ef444450", color: "#f87171", "&:hover": { bgcolor: "#ef444415" } }}
        >
          Cerrar Sesión
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", overflowX: "hidden" }}>
      <CssBaseline />

      {/* Top Navbar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: "#ffffff",
          color: "text.primary",
          boxShadow: "none",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 1.5, sm: 3 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleMobileOpen}
            sx={{ mr: 1, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 800, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
            {navItems.find((n) => n.path === location.pathname)?.label || "Panel Administrador"}
          </Typography>

          <Chip
            label="● En Línea"
            size="small"
            sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: "0.7rem" }}
          />
        </Toolbar>
      </AppBar>

      {/* Responsive Navigation Drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={toggleMobileOpen}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH, borderRight: "none" },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Container */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 3.5 },
          width: { xs: "100%", md: `calc(100% - ${DRAWER_WIDTH}px)` },
          maxWidth: "100vw",
          overflowX: "hidden",
          mt: 7,
          bgcolor: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
