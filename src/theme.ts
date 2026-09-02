import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1e40af", // Deep Blue
      light: "#3b82f6",
      dark: "#1e3a8a",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#059669", // Emerald Green
      light: "#10b981",
      dark: "#047857",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
    subtitle1: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": { boxSizing: "border-box" },
        "html, body, #root": { minHeight: "100%" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          },
          "@media (max-width:599px)": {
            minHeight: 44,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.03)",
          border: "1px solid #e2e8f0",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTabs: {
      defaultProps: {
        variant: "scrollable",
        scrollButtons: "auto",
        allowScrollButtonsMobile: true,
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minWidth: 0,
          "@media (max-width:599px)": { paddingInline: 12, fontSize: "0.78rem" },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          margin: 12,
          width: "calc(100% - 24px)",
          maxHeight: "calc(100% - 24px)",
          "@media (min-width:600px)": { margin: 24, width: "calc(100% - 48px)" },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: "16px 20px",
          fontSize: "1.05rem",
          lineHeight: 1.3,
          "& .MuiIconButton-root": { flexShrink: 0 },
          "@media (max-width:599px)": { padding: "14px 16px", fontSize: "1rem" },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          "@media (max-width:599px)": { padding: "16px !important" },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          gap: 8,
          flexWrap: "wrap",
          "& > :not(style) ~ :not(style)": { marginLeft: 0 },
          "@media (max-width:599px)": {
            padding: "12px 16px !important",
            "& .MuiButton-root": { flex: "1 1 140px" },
          },
        },
      },
    },
  },
});
