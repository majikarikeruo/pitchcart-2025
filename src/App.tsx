import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@/style.css";
import Entry from "@/pages/Entry";
import Result from "@/pages/Result";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";

function App() {
  return (
    <MantineProvider>
      <Notifications />
      <BrowserRouter>
        <AuthProvider>
          <AppLayout>
            <Routes>
              <Route
                path="/login"
                element={(<AuthGuard requireAuth={false}><Login /></AuthGuard>)}
              />
              <Route
                path="/"
                element={(<AuthGuard><Entry /></AuthGuard>)}
              />
              <Route
                path="/entry"
                element={(<AuthGuard><Entry /></AuthGuard>)}
              />
              <Route
                path="/result"
                element={(<AuthGuard><Result /></AuthGuard>)}
              />
              <Route path="/history" element={<Navigate to="/result?tab=history" replace />} />
              <Route path="/analysis" element={<Navigate to="/entry" replace />} />
              <Route path="/practice" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
