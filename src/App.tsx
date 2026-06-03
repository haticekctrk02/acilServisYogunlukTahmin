import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { DashboardPage } from './pages/DashboardPage'
import { HistoricalDataPage } from './pages/HistoricalDataPage'
import { LiveMonitoringPage } from './pages/LiveMonitoringPage'
import { MLInsightsPage } from './pages/MLInsightsPage'
import { PredictionsPage } from './pages/PredictionsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="predictions" element={<PredictionsPage />} />
          <Route path="live" element={<LiveMonitoringPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="historical" element={<HistoricalDataPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="ml-insights" element={<MLInsightsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
