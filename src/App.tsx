import { Route, Routes } from 'react-router-dom'
import { useStore } from './storage/StoreContext'
import BottomNav from './components/BottomNav'
import Onboarding from './components/Onboarding'
import TodayPage from './pages/TodayPage'
import WeightPage from './pages/WeightPage'
import HabitsPage from './pages/HabitsPage'
import FutsalPage from './pages/FutsalPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import CalendarPage from './pages/CalendarPage'

export default function App() {
  const { db, ready } = useStore()

  if (!ready) return null

  if (!db.meta.onboarded) return <Onboarding />

  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg px-4 pb-24 pt-5">
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/weight" element={<WeightPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/futsal" element={<FutsalPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="*" element={<TodayPage />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
