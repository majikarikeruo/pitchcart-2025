import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@/style.css";
import Home from "@/pages/Home";
import Entry from "@/pages/Entry";
import Result from "@/pages/Result";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";

function App() {
  return (
    <MantineProvider>
      <Notifications />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={
              <AuthGuard requireAuth={false}>
                <Login />
              </AuthGuard>
            } />
            <Route path="/" element={<Home />} />
            <Route path="/entry" element={
              <AuthGuard>
                <Entry />
              </AuthGuard>
            } />
            <Route path="/result" element={
              <AuthGuard>
                <Result />
              </AuthGuard>
            } />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
