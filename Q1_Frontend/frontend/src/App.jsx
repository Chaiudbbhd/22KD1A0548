import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Container, Box } from "@mui/material";
import Shortener from "./pages/Shortener.jsx";
import Stats from "./pages/Stats.jsx";
import "./App.css";

function Bar() {
  const loc = useLocation();
  const navItems = [
    { label: "Shorten", path: "/" },
    { label: "Stats", path: "/stats" },
  ];

  return (
    <AppBar
      position="static"
      sx={{
        background: "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        borderRadius: "0 0 12px 12px",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}
        >
          URL Shortener
        </Typography>
        <Box>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              sx={{
                mx: 1,
                px: 2,
                color: loc.pathname === item.path ? "#fff" : "rgba(255,255,255,0.8)",
                backgroundColor: loc.pathname === item.path ? "rgba(255,255,255,0.2)" : "transparent",
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: loc.pathname === item.path ? "bold" : "normal",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.3)",
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Bar />
      <Container
        maxWidth="md"
        sx={{
          mt: 4,
          p: 3,
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
        }}
      >
        <Routes>
          <Route path="/" element={<Shortener />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}
