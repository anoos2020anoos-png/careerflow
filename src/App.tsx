import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AppDataProvider } from '@/state/AppDataProvider';
import { ThemeProvider } from '@/state/ThemeProvider';
import { DashboardPage } from '@/pages/DashboardPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { ApplicationDetailPage } from '@/pages/ApplicationDetailPage';
import { SettingsPage } from '@/pages/SettingsPage';

/**
 * `HashRouter` rather than `BrowserRouter`: GitHub Pages serves static files
 * only, so a deep link such as `/applications/abc` would 404 on refresh. Hash
 * routes (`/#/applications/abc`) are resolved entirely in the browser and need
 * no server rewrite rules.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="applications/:applicationId" element={<ApplicationDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AppDataProvider>
    </ThemeProvider>
  );
}
